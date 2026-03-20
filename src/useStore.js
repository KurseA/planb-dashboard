import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEY } from "./data";

const DEFAULT_ACTUALS = {
  0: { sales: "5266", cash: "4421", ar: "11700", ap: "3553" },
  1: { sales: "5114", cash: "5725", ar: "8827", ap: "2258" },
};

const MAX_HISTORY = 50;

export function useStore() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [actuals, setActuals] = useState(() => ({ ...DEFAULT_ACTUALS }));
  const [notes, setNotes] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimer = useRef(null);

  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistory = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Push current state to history
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const loadedActuals = { ...DEFAULT_ACTUALS, ...(saved.actuals || {}) };
        const loadedNotes = saved.notes || {};
        setActuals(loadedActuals);
        setNotes(loadedNotes);
        if (typeof saved.selectedMonth === "number") setSelectedMonth(saved.selectedMonth);
        if (saved.lastSaved) setLastSaved(saved.lastSaved);
        // Init history with loaded state
        setHistory([{ actuals: loadedActuals, notes: loadedNotes }]);
        setHistoryIndex(0);
      } else {
        setHistory([{ actuals: { ...DEFAULT_ACTUALS }, notes: {} }]);
        setHistoryIndex(0);
      }
    } catch (e) {
      setHistory([{ actuals: { ...DEFAULT_ACTUALS }, notes: {} }]);
      setHistoryIndex(0);
    }
  }, []);

  // Debounced save to localStorage
  const save = useCallback((newActuals, newNotes, newMonth) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const now = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          actuals: newActuals ?? actuals,
          notes: newNotes ?? notes,
          selectedMonth: newMonth ?? selectedMonth,
          lastSaved: now
        }));
        setLastSaved(now);
      } catch (e) { /* ignore */ }
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
    save(actuals, notes, m);
  }, [actuals, notes, save]);

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
    selectedMonth, actuals, notes, lastSaved,
    selectMonth, updateActual, updateNote,
    undo, redo, canUndo, canRedo
  };
}
