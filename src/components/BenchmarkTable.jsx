import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { D, fmt, fmtFull, checkMetric, monthStatus, earlyWarningCheck, payoffDecision, BASE_PAYMENT } from "../data";

function ActualInput({ value, onChange, placeholder = "—", disabled = false }) {
  const [local, setLocal] = useState(value);
  const inputRef = useRef(null);
  const isFocused = useRef(false);

  useEffect(() => {
    // Don't overwrite while user is typing (prevents remote sync from stealing focus)
    if (!isFocused.current) {
      setLocal(value);
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      className="actual-input"
      value={local}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => {
        isFocused.current = false;
        // Sync from props if different after blur
        if (local !== value) setLocal(value);
      }}
      onChange={e => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
      style={disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
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

function SignalBadge({ signal }) {
  const config = {
    green: { bg: "rgba(29,158,117,0.12)", color: "var(--green2)", icon: "🟢", text: "เตรียมโปะได้" },
    yellow: { bg: "var(--amber-bg)", color: "var(--amber2)", icon: "🟡", text: "รอดูอีก" },
    red: { bg: "var(--red-bg)", color: "var(--red2)", icon: "🔴", text: "อย่าเพิ่งโปะ" },
    pending: { bg: "rgba(255,255,255,0.03)", color: "var(--t4)", icon: "⏳", text: "รอกรอกข้อมูล" },
  };
  const c = config[signal] || config.pending;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: c.bg, fontSize: 12, fontFamily: "var(--thai)", color: c.color }}
    >
      {c.icon} <strong>{c.text}</strong>
    </motion.div>
  );
}

function EarlyWarningSection({ month, actuals, onUpdateActual }) {
  const m = month;
  const ew = earlyWarningCheck(actuals, m);

  // Auto-calculate netBank from cash - od
  const cashVal = parseFloat(actuals[m]?.cash || "");
  const odVal = parseFloat(actuals[m]?.od || "");
  const autoNetBank = (!isNaN(cashVal) && !isNaN(odVal)) ? (cashVal - odVal).toString() : "";

  useEffect(() => {
    if (autoNetBank && autoNetBank !== (actuals[m]?.netBank || "")) {
      onUpdateActual(m, "netBank", autoNetBank);
    }
  }, [autoNetBank, m]);

  const ewRows = [
    { key: "od", label: "OD Balance", rule: "≤", target: D.odMax[m], color: "var(--red2)", check: ew.checks.od },
    { key: "netBank", label: "Net Bank Position", rule: "≥", target: D.netBankMin[m], color: "var(--blue)", check: ew.checks.netBank, auto: true },
    { key: "backlog", label: "Backlog / PO", rule: "≥", target: D.backlogMin[m], color: "var(--amber2)", check: ew.checks.backlog },
  ];

  return (
    <motion.div
      style={{ marginBottom: 16, padding: "16px 18px", background: "var(--card2)", borderRadius: 10, border: "1px solid var(--border)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--amber2)", fontFamily: "var(--thai)" }}>
          🔔 Early Warning — วันที่ 10
        </span>
        {ew.total > 0 && (
          <span className="badge" style={{ background: "var(--amber-bg)", color: "var(--amber2)", fontSize: 9 }}>
            {ew.passed}/{ew.total}
          </span>
        )}
      </div>
      <table className="bench-table">
        <thead>
          <tr>
            <td style={{ width: "28%" }}>Metric</td>
            <td style={{ width: "20%", textAlign: "right" }}>เป้า</td>
            <td style={{ width: "28%", textAlign: "right" }}>Actual (พัน฿)</td>
            <td style={{ width: "24%", textAlign: "center" }}>Status</td>
          </tr>
        </thead>
        <tbody>
          {ewRows.map((r, i) => {
            const val = actuals[m]?.[r.key] || "";
            return (
              <motion.tr
                key={r.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <td style={{ borderLeft: `3px solid ${r.color}` }}>
                  <span style={{ fontFamily: "var(--thai)", fontSize: 12, color: "var(--t2)" }}>{r.label}</span>
                  {r.auto && <span style={{ fontSize: 9, color: "var(--t4)", marginLeft: 4 }}>(auto)</span>}
                </td>
                <td style={{ textAlign: "right", fontWeight: 500, color: "var(--t1)" }}>{r.rule} {fmt(r.target)}</td>
                <td style={{ textAlign: "right" }}>
                  <ActualInput
                    value={val}
                    onChange={v => onUpdateActual(m, r.key, v)}
                    disabled={r.auto && autoNetBank !== ""}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <StatusBadge ok={r.check} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      <SignalBadge signal={ew.signal} />
    </motion.div>
  );
}

function CashFlowSection({ month, actuals, onUpdateActual }) {
  const m = month;
  const collVal = parseFloat(actuals[m]?.collectionDue || "");
  const payVal = parseFloat(actuals[m]?.paymentDue || "");
  const netFlow = (!isNaN(collVal) && !isNaN(payVal)) ? collVal - payVal : null;

  const collOk = !isNaN(collVal) ? collVal >= D.collectionDueMin[m] : null;
  const payOk = !isNaN(payVal) ? payVal <= D.paymentDueMax[m] : null;

  const cfRows = [
    { key: "collectionDue", label: "Collection Due (15 วัน)", rule: "≥", target: D.collectionDueMin[m], color: "var(--green2)", check: collOk },
    { key: "paymentDue", label: "Payment Due (15 วัน)", rule: "≤", target: D.paymentDueMax[m], color: "var(--red2)", check: payOk },
  ];

  return (
    <motion.div
      style={{ marginTop: 16, padding: "16px 18px", background: "var(--card2)", borderRadius: 10, border: "1px solid var(--border)" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t3)", marginBottom: 12, fontFamily: "var(--thai)" }}>
        📋 Cash Flow Visibility (ข้อมูลเสริม)
      </div>
      <table className="bench-table">
        <thead>
          <tr>
            <td style={{ width: "28%" }}>Metric</td>
            <td style={{ width: "20%", textAlign: "right" }}>เป้า</td>
            <td style={{ width: "28%", textAlign: "right" }}>Actual (พัน฿)</td>
            <td style={{ width: "24%", textAlign: "center" }}>Status</td>
          </tr>
        </thead>
        <tbody>
          {cfRows.map((r, i) => {
            const val = actuals[m]?.[r.key] || "";
            return (
              <motion.tr
                key={r.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <td style={{ borderLeft: `3px solid ${r.color}` }}>
                  <span style={{ fontFamily: "var(--thai)", fontSize: 12, color: "var(--t2)" }}>{r.label}</span>
                </td>
                <td style={{ textAlign: "right", fontWeight: 500, color: "var(--t1)" }}>{r.rule} {fmt(r.target)}</td>
                <td style={{ textAlign: "right" }}>
                  <ActualInput value={val} onChange={v => onUpdateActual(m, r.key, v)} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <StatusBadge ok={r.check} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {netFlow !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)",
            background: netFlow >= 0 ? "rgba(29,158,117,0.08)" : "var(--red-bg)",
            color: netFlow >= 0 ? "var(--green2)" : "var(--red2)"
          }}
        >
          Net Flow = {fmt(collVal)} - {fmt(payVal)} = <strong>{netFlow >= 0 ? "+" : ""}{fmt(netFlow)}</strong>
          {netFlow >= 0 ? " → cash inflow สุทธิดี" : " → cash outflow สุทธิ ระวัง!"}
        </motion.div>
      )}
    </motion.div>
  );
}

function PaymentSection({ month, actuals, debtPlan, onUpdateActual }) {
  const m = month;
  const p = debtPlan[m];
  const prevRemaining = m > 0 ? debtPlan[m - 1].remaining : 5187;
  const targetExtra = p.targetExtra;
  const targetTotal = BASE_PAYMENT + targetExtra;
  const actualVal = actuals[m]?.actualPayment || "";

  return (
    <motion.div
      style={{ marginBottom: 16, padding: "16px 18px", background: "linear-gradient(135deg, #0d1a14, #0d1117)", borderRadius: 10, border: "1px solid var(--green)", borderLeftWidth: 3 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green2)", marginBottom: 12, fontFamily: "var(--thai)" }}>
        💳 ยอดชำระหนี้เดือนนี้
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--t4)", textTransform: "uppercase", marginBottom: 2 }}>หนี้ก่อนจ่าย</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--t1)" }}>{fmt(prevRemaining)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--t4)", textTransform: "uppercase", marginBottom: 2 }}>หนี้หลังจ่าย</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: p.remaining === 0 ? "var(--green2)" : "var(--t1)" }}>{fmt(p.remaining)}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 10, color: "var(--t4)", marginBottom: 4, fontFamily: "var(--thai)" }}>
            Suggested: <span style={{ color: "var(--amber2)" }}>{fmt(targetTotal)}</span>
            {targetExtra > 0 && <span style={{ color: "var(--t5)" }}> (ปกติ {fmt(BASE_PAYMENT)} + โปะ {fmt(targetExtra)})</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--thai)" }}>จ่ายจริง:</span>
            <ActualInput
              value={actualVal}
              onChange={v => onUpdateActual(m, "actualPayment", v)}
              placeholder={targetTotal.toString()}
            />
            <span style={{ fontSize: 11, color: "var(--t4)" }}>พัน฿</span>
          </div>
        </div>
        {p.hasActual && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 11, fontFamily: "var(--thai)",
              background: p.actualPayment >= targetTotal ? "rgba(29,158,117,0.1)" : "var(--amber-bg)",
              color: p.actualPayment >= targetTotal ? "var(--green2)" : "var(--amber2)"
            }}
          >
            {p.actualPayment >= targetTotal
              ? `✓ จ่ายครบ${p.actualPayment > targetTotal ? " (เกิน " + fmt(p.actualPayment - targetTotal) + ")" : ""}`
              : `↓ จ่ายน้อยกว่า ${fmt(targetTotal - p.actualPayment)}`
            }
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function BenchmarkTable({ month, actuals, notes, debtPlan, onUpdateActual, onUpdateNote }) {
  const m = month;
  const ms = monthStatus(actuals, m);
  const decision = useMemo(() => payoffDecision(actuals, m, debtPlan), [actuals, m, debtPlan]);
  const p = debtPlan[m];
  const targetExtra = p.targetExtra;

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
            className={`badge ${targetExtra > 0 ? "badge-extra" : p.remaining === 0 ? "badge-done" : "badge-warn"}`}
            style={{ marginLeft: 10, fontSize: 11, padding: "3px 10px" }}
          >
            {D.phase[m]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--t4)" }}>
          จ่ายรวม: <span style={{ color: "var(--t1)", fontWeight: 500 }}>{fmtFull(p.effectiveTotal)} ฿</span>
          {p.hasActual && <span style={{ color: "var(--green2)", marginLeft: 4 }}>(จริง)</span>}
        </div>
      </div>

      {/* Payment Section */}
      <PaymentSection month={m} actuals={actuals} debtPlan={debtPlan} onUpdateActual={onUpdateActual} />

      {/* Early Warning Section */}
      <EarlyWarningSection month={m} actuals={actuals} onUpdateActual={onUpdateActual} />

      {/* Final Check Section Label */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green2)", marginBottom: 10, fontFamily: "var(--thai)" }}>
        📊 Final Check — วันที่ 20-25
      </div>

      {/* Final Check Table */}
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

      {/* Decision Box — 2 ชั้น */}
      <AnimatePresence>
        {targetExtra > 0 && (
          <motion.div
            className="decision"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ fontSize: 12, color: "var(--amber2)", fontWeight: 500, marginBottom: 4, fontFamily: "var(--thai)" }}>
              แนะนำโปะเพิ่ม {fmtFull(targetExtra)} ฿
              {p.targetExtra !== D.dirExtraSuggested[m] && <span style={{ fontSize: 10, color: "var(--t4)", marginLeft: 6 }}>(ปรับจากแผนเดิม {fmtFull(D.dirExtraSuggested[m])})</span>}
            </div>
            <div style={{ fontSize: 11, color: "#A88544", lineHeight: 1.7, fontFamily: "var(--thai)" }}>
              ชั้น 1: Early Warning (วันที่ 10) → ถ้าแดงไม่โปะเลย &nbsp;|&nbsp;
              ชั้น 2: Final Check → 4/4 โปะเต็ม | 3/4 โปะ 50% | ≤2/4 จ่ายปกติ
            </div>

            {decision.action === "blocked" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)", background: "var(--red-bg)", color: "var(--red2)" }}>
                🔴 Early Warning ไม่ผ่าน → <strong>ไม่โปะ จ่ายเฉพาะปกติ {fmtFull(BASE_PAYMENT)} ฿</strong>
              </motion.div>
            )}
            {decision.action === "full" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)", background: "rgba(29,158,117,0.1)", color: "var(--green2)" }}>
                ✅ ผ่านทั้ง 2 ชั้น → <strong>โปะเต็มจำนวน {fmtFull(targetExtra)} ฿</strong>
              </motion.div>
            )}
            {decision.action === "half" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)", background: "var(--amber-bg)", color: "var(--amber2)" }}>
                ⚠️ Final 3/4 ผ่าน → <strong>โปะ 50% = {fmtFull(targetExtra / 2)} ฿</strong>
              </motion.div>
            )}
            {decision.action === "regular" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)", background: "var(--red-bg)", color: "var(--red2)" }}>
                ⛔ Final ≤2/4 → <strong>จ่ายเฉพาะปกติ {fmtFull(BASE_PAYMENT)} ฿</strong>
              </motion.div>
            )}
            {decision.action === "waiting" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--thai)", background: "rgba(255,255,255,0.03)", color: "var(--t3)" }}>
                ⏳ รอ Final Check — Early Warning: {decision.signal === "green" ? "🟢 พร้อม" : "🟡 ระวัง"}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash Flow Visibility */}
      <CashFlowSection month={m} actuals={actuals} onUpdateActual={onUpdateActual} />

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
