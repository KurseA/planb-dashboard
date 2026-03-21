import { motion } from "framer-motion";
import { D, fmt, TOTAL_DEBT } from "../data";

export default function ProgressBar({ month, debtPlan, onSelectMonth }) {
  const m = month;
  const remaining = debtPlan[m].remaining;
  const pctPaid = (TOTAL_DEBT - remaining) / TOTAL_DEBT * 100;

  return (
    <motion.div
      className="card"
      style={{ padding: "16px 18px" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--thai)" }}>ความคืบหน้าชำระหนี้กรรมการ</span>
        <span style={{ fontSize: 12, color: "var(--green2)", fontWeight: 500 }}>{fmt(TOTAL_DEBT - remaining)} / 5.19M</span>
      </div>
      <div className="progress-bar">
        <motion.div
          className={`progress-fill ${pctPaid >= 100 ? "done" : ""}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pctPaid, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {D.months.map((mo, i) => {
          const p = debtPlan[i];
          const hasExtra = p.targetExtra > 0;
          return (
            <div
              key={i}
              onClick={() => onSelectMonth(i)}
              style={{
                fontSize: 9,
                textAlign: "center",
                color: i === m ? "var(--green2)" : i <= m ? "var(--t4)" : "var(--t5)",
                fontWeight: i === m ? 600 : 400,
                cursor: "pointer",
                padding: "2px 0",
                borderBottom: hasExtra ? "2px solid var(--amber)" : p.hasActual ? "2px solid var(--green)" : "none"
              }}
            >
              {mo.replace(".", "")}
              {hasExtra && <><br /><span style={{ color: "var(--amber)", fontSize: 8 }}>โปะ</span></>}
              {!hasExtra && p.hasActual && <><br /><span style={{ color: "var(--green)", fontSize: 8 }}>✓</span></>}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
