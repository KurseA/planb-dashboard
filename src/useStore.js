import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEY } from "./data";
import { supabase } from "./supabaseClient";

const DEFAULT_ACTUALS = {
  0: { sales: "5266", cash: "4421", ar: "11700", ap: "3553" },
  1: { sales: "5114", cash: "5725", ar: "8827", ap: "2258" },
};

const MAX_HISTORY = 50;
const TABLE = "dashboard_state";
const ROW_ID = "shared";

export function useStore() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [actuals, setActuals] = useState(() => ({ ...DEFAULT_ACTUALS }));
  const [notes, setNotes] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [syncStatus, setSyncStatus] = useState("loading"); // loading | connected | offline
  const saveTimer = useRef(null);
  const clientId = useRef(crypto.randomUUID());
  const isRemoteUpdate = useRef(false);

  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistory = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = useCallback((newActuals, newNotes) => {
    if (skipHistory.current) { skipHistory.current = false; return; }
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, { actuals: newActuals, notes: newNotes }];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  // Load from Supabase (primary) → fallback localStorage
  useEffect(() => {
    let channel;

    async function init() {
      let loadedActuals = { ...DEFAULT_ACTUALS };
      let loadedNotes = {};

      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select("*")
          .eq("id", ROW_ID)
          .single();

        if (!error && data) {
          loadedActuals = { ...DEFAULT_ACTUALS, ...(data.actuals || {}) };
          loadedNotes = data.notes || {};
          if (data.updated_at) setLastSaved(data.updated_at);
          setSyncStatus("connected");
        } else {
          throw new Error("Supabase fetch failed");
        }
      } catch {
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const saved = JSON.parse(raw);
            loadedActuals = { ...DEFAULT_ACTUALS, ...(saved.actuals || {}) };
            loadedNotes = saved.notes || {};
            if (typeof saved.selectedMonth === "number") setSelectedMonth(saved.selectedMonth);
            if (saved.lastSaved) setLastSaved(saved.lastSaved);
          }
        } catch { /* ignore */ }
        setSyncStatus("offline");
      }

      setActuals(loadedActuals);
      setNotes(loadedNotes);
      setHistory([{ actuals: loadedActuals, notes: loadedNotes }]);
      setHistoryIndex(0);

      // Cache to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          actuals: loadedActuals,
          notes: loadedNotes,
          selectedMonth: new Date().getMonth(),
          lastSaved: new Date().toISOString()
        }));
      } catch { /* ignore */ }

      // Subscribe to real-time changes
      channel = supabase
        .channel("dashboard-sync")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: TABLE },
          (payload) => {
            const remote = payload.new;
            // Ignore own writes
            if (remote.updated_by === clientId.current) return;

            const remoteActuals = { ...DEFAULT_ACTUALS, ...(remote.actuals || {}) };
            const remoteNotes = remote.notes || {};

            isRemoteUpdate.current = true;
            skipHistory.current = true;
            setActuals(remoteActuals);
            setNotes(remoteNotes);
            setLastSaved(remote.updated_at);
            setSyncStatus("connected");

            // Update localStorage cache
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                actuals: remoteActuals,
                notes: remoteNotes,
                lastSaved: remote.updated_at
              }));
            } catch { /* ignore */ }

            setTimeout(() => { isRemoteUpdate.current = false; }, 100);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setSyncStatus("connected");
        });
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Save to localStorage + Supabase
  const save = useCallback((newActuals, newNotes, newMonth) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const now = new Date().toISOString();

      // Save to localStorage (cache/fallback)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          actuals: newActuals ?? actuals,
          notes: newNotes ?? notes,
          selectedMonth: newMonth ?? selectedMonth,
          lastSaved: now
        }));
      } catch { /* ignore */ }

      // Save to Supabase
      try {
        const { error } = await supabase
          .from(TABLE)
          .upsert({
            id: ROW_ID,
            actuals: newActuals ?? actuals,
            notes: newNotes ?? notes,
            updated_at: now,
            updated_by: clientId.current
          });
        if (!error) {
          setSyncStatus("connected");
        } else {
          setSyncStatus("offline");
        }
      } catch {
        setSyncStatus("offline");
      }

      setLastSaved(now);
    }, 500);
  }, [actuals, notes, selectedMonth]);

  const updateActual = useCallback((month, key, value) => {
    setActuals(prev => {
      const next = { ...prev, [month]: { ...(prev[month] || {}), [key]: value } };
      pushHistory(next, notes);
      save(next, notes, selectedMonth);
      return next;
    });
  }, [notes, selectedMonth, save, pushHistory]);

  const updateNote = useCallback((month, value) => {
    setNotes(prev => {
      const next = { ...prev, [month]: value };
      pushHistory(actuals, next);
      save(actuals, next, selectedMonth);
      return next;
    });
  }, [actuals, selectedMonth, save, pushHistory]);

  const selectMonth = useCallback((m) => {
    setSelectedMonth(m);
    // selectedMonth is local-only, just save to localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        saved.selectedMonth = m;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      }
    } catch { /* ignore */ }
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    skipHistory.current = true;
    setActuals(snapshot.actuals);
    setNotes(snapshot.notes);
    setHistoryIndex(newIndex);
    save(snapshot.actuals, snapshot.notes, selectedMonth);
  }, [canUndo, historyIndex, history, selectedMonth, save]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    skipHistory.current = true;
    setActuals(snapshot.actuals);
    setNotes(snapshot.notes);
    setHistoryIndex(newIndex);
    save(snapshot.actuals, snapshot.notes, selectedMonth);
  }, [canRedo, historyIndex, history, selectedMonth, save]);

  return {
    selectedMonth, actuals, notes, lastSaved, syncStatus,
    selectMonth, updateActual, updateNote,
    undo, redo, canUndo, canRedo
  };
}
