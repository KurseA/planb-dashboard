import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { D, fmt, fmtFull, checkMetric, monthStatus } from "../data";

function ActualInput({ value, onChange, placeholder = "—" }) {
  const [local, setLocal] = useState(value);
  const inputRef = useRef(null);

  // Sync from parent only when value changes externally
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <input
      ref={inputRef}
      className="actual-input"
      value={local}
      placeholder={placeholder}
      onChange={e => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}

function StatusBadge({ ok }) {
  if (ok === null) return <span style={{ color: "var(--t5)" }}>—</span>;
  return (
    <motion.span
      className={`badge ${ok ? "badge-pass" : "badge-fail"}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {ok ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}
    </motion.span>
  );
}

export default function BenchmarkTable({ month, actuals, notes, onUpdateActual, onUpdateNote }) {
  const m = month;
  const ms = monthStatus(actuals, m);

  const rows = [
    { key: "sales", label: "Sales ยอดขาย", half: D.halfSales[m], full: D.salesTarget[m], rule: "≥", color: "var(--blue)" },
    { key: "cash", label: "Cash เงินสด", half: Math.round(D.cashMin[m] * 0.75), full: D.cashMin[m], rule: "≥", color: "var(--green2)" },
    { key: "ar", label: "AR ลูกหนี้", half: D.arMax[m], full: D.arMax[m], rule: "≤", color: "var(--amber2)" },
    { key: "ap", label: "AP เจ้าหนี้", half: Math.round(D.apMin[m] * 0.8), full: D.apMin[m], rule: "≥", color: "var(--purple)" },
  ];

  return (
    <motion.div
      className="card"
      key={m}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Month Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--t1)", fontFamily: "var(--thai)" }}>{D.months[m]} 2569</span>
          <span
            className={`badge ${D.dirExtra[m] > 0 ? "badge-extra" : D.dirBal[m] === 0 ? "badge-done" : "badge-warn"}`}
            style={{ marginLeft: 10, fontSize: 11, padding: "3px 10px" }}
          >
            {D.phase[m]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--t4)" }}>
          จ่ายรวม: <span style={{ color: "var(--t1)", fontWeight: 500 }}>{fmtFull(D.dirTotal[m])} ฿</span>
        </div>
      </div>

      {/* Table */}
      <table className="bench-table">
        <thead>
          <tr>
            <td style={{ width: "22%" }}>Metric</td>
            <td style={{ width: "16%", textAlign: "right" }}>½ เดือน</td>
            <td style={{ width: "16%", textAlign: "right" }}>Full-month</td>
            <td style={{ width: "24%", textAlign: "right" }}>Actual (พัน฿)</td>
            <td style={{ width: "22%", textAlign: "center" }}>Status</td>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ok = checkMetric(actuals, m, r.key);
            const val = actuals[m]?.[r.key] || "";
            return (
              <motion.tr
                key={r.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <td style={{ borderLeft: `3px solid ${r.color}` }}>
                  <span style={{ fontFamily: "var(--thai)", fontSize: 12, color: "var(--t2)" }}>{r.label}</span>
                </td>
                <td style={{ textAlign: "right", color: "var(--t3)", fontSize: 12 }}>{r.rule} {fmt(r.half)}</td>
                <td style={{ textAlign: "right", fontWeight: 500, color: "var(--t1)" }}>{r.rule} {fmt(r.full)}</td>
                <td style={{ textAlign: "right" }}>
                  <ActualInput
                    value={val}
                    onChange={v => onUpdateActual(m, r.key, v)}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <StatusBadge ok={ok} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* Decision Box */}
      <AnimatePresence>
        {D.dirExtra[m] > 0 && (
          <motion.div
            className="decision"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ fontSize: 12, color: "var(--amber2)", fontWeight: 500, marginBottom: 4, fontFamily: "var(--thai)" }}>
              การตัดสินใจโปะเพิ่ม {fmtFull(D.dirExtra[m])} ฿
            </div>
            <div style={{ fontSize: 11, color: "#A88544", lineHeight: 1.7, fontFamily: "var(--thai)" }}>
              4/4 ผ่าน → โปะเต็มจำนวน &nbsp;|&nbsp; 3/4 ผ่าน → โปะ 50% &nbsp;|&nbsp; ≤ 2/4 → จ่ายปกติเท่านั้น
            </div>
            {ms && ms.checked >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)",
                  ...(ms.passed >= 4
                    ? { background: "rgba(29,158,117,0.1)", color: "var(--green2)" }
                    : ms.passed >= 3
                      ? { background: "var(--amber-bg)", color: "var(--amber2)" }
                      : { background: "var(--red-bg)", color: "var(--red2)" }
                  )
                }}
              >
                {ms.passed >= 4 && <>✅ ผ่าน {ms.passed}/4 → <strong>โปะเต็มจำนวน {fmtFull(D.dirExtra[m])} ฿</strong></>}
                {ms.passed === 3 && <>⚠️ ผ่าน {ms.passed}/4 → <strong>โปะ 50% = {fmtFull(D.dirExtra[m] / 2)} ฿</strong></>}
                {ms.passed < 3 && <>⛔ ผ่าน {ms.passed}/4 → <strong>จ่ายเฉพาะปกติ 235,750 ฿</strong></>}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 6, fontFamily: "var(--thai)" }}>
          บันทึกประจำเดือน {D.months[m]}
        </div>
        <NotesArea value={notes[m] || ""} onChange={v => onUpdateNote(m, v)} month={m} />
      </div>
    </motion.div>
  );
}

function NotesArea({ value, onChange, month }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value, month]);

  return (
    <textarea
      className="notes-area"
      placeholder="จดบันทึก เช่น สาเหตุ AR สูง, ลูกค้าจ่ายช้า, สต๊อกเพิ่ม..."
      value={local}
      onChange={e => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}
