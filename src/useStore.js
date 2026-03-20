import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEY } from "./data";

const DEFAULT_ACTUALS = {
  0: { sales: "5266", cash: "4421", ar: "11700", ap: "3553" },
  1: { sales: "5114", cash: "5725", ar: "8827", ap: "2258" },
};

export function useStore() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [actuals, setActuals] = useState(() => ({ ...DEFAULT_ACTUALS }));
  const [notes, setNotes] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimer = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setActuals(prev => ({ ...DEFAULT_ACTUALS, ...prev, ...(saved.actuals || {}) }));
        setNotes(saved.notes || {});
        if (typeof saved.selectedMonth === "number") setSelectedMonth(saved.selectedMonth);
        if (saved.lastSaved) setLastSaved(saved.lastSaved);
      }
    } catch (e) { /* ignore */ }
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
      save(next, notes, selectedMonth);
      return next;
    });
  }, [notes, selectedMonth, save]);

  const updateNote = useCallback((month, value) => {
    setNotes(prev => {
      const next = { ...prev, [month]: value };
      save(actuals, next, selectedMonth);
      return next;
    });
  }, [actuals, selectedMonth, save]);

  const selectMonth = useCallback((m) => {
    setSelectedMonth(m);
    save(actuals, notes, m);
  }, [actuals, notes, save]);

  const exportData = useCallback(() => {
    const data = { benchmark: "Sweetchew Plan B", exported: new Date().toISOString(), actuals, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "planb_benchmark_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
  }, [actuals, notes]);

  const importData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.actuals) setActuals(prev => ({ ...prev, ...data.actuals }));
        if (data.notes) setNotes(prev => ({ ...prev, ...data.notes }));
        save(
          { ...actuals, ...(data.actuals || {}) },
          { ...notes, ...(data.notes || {}) },
          selectedMonth
        );
        alert("นำเข้าข้อมูลสำเร็จ!");
      } catch { alert("ไฟล์ไม่ถูกต้อง"); }
    };
    reader.readAsText(file);
  }, [actuals, notes, selectedMonth, save]);

  const clearData = useCallback(() => {
    if (confirm("ล้างข้อมูลทั้งหมด? (ยกเว้น ม.ค.-ก.พ. ที่เป็น actual)")) {
      setActuals({ ...DEFAULT_ACTUALS });
      setNotes({});
      save({ ...DEFAULT_ACTUALS }, {}, selectedMonth);
    }
  }, [selectedMonth, save]);

  return {
    selectedMonth, actuals, notes, lastSaved,
    selectMonth, updateActual, updateNote,
    exportData, importData, clearData
  };
}
