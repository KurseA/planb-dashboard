import { motion } from "framer-motion";
import { D, monthStatus } from "../data";

export default function YearTable({ month, actuals, onSelectMonth }) {
  return (
    <motion.div
      className="card"
      style={{ overflowX: "auto" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t2)", fontFamily: "var(--thai)" }}>Benchmark ทั้ง 12 เดือน (พันบาท)</div>
        <div style={{ fontSize: 10, color: "var(--t4)" }}>คลิกเลือกเดือน</div>
      </div>
      <table className="year-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>เดือน</th>
            <th style={{ color: "var(--blue)" }}>Sales เป้า</th>
            <th style={{ color: "var(--blue)" }}>½ เดือน</th>
            <th style={{ color: "var(--green2)" }}>Cash min</th>
            <th style={{ color: "var(--amber2)" }}>AR max</th>
            <th style={{ color: "var(--purple)" }}>AP min</th>
            <th style={{ color: "var(--red2)" }}>โปะเพิ่ม</th>
            <th style={{ color: "var(--red2)" }}>หนี้เหลือ</th>
            <th style={{ textAlign: "center" }}>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {D.months.map((mo, i) => {
            const sel = i === month;
            const isExtra = D.dirExtra[i] > 0;
            const done = D.dirBal[i] === 0;
            const st = monthStatus(actuals, i);

            return (
              <motion.tr
                key={i}
                className={sel ? "selected" : ""}
                onClick={() => onSelectMonth(i)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                style={{ cursor: "pointer" }}
              >
                <td style={{ fontWeight: sel ? 600 : 400, color: sel ? "var(--green2)" : "var(--t2)" }}>
                  {sel ? "▸ " : ""}{mo}
                </td>
                <td style={{ color: "var(--t1)" }}>{D.salesTarget[i].toLocaleString()}</td>
                <td style={{ color: "var(--t3)" }}>{D.halfSales[i].toLocaleString()}</td>
                <td style={{ color: i === 7 ? "var(--amber2)" : "var(--t1)" }}>{D.cashMin[i].toLocaleString()}</td>
                <td>{D.arMax[i].toLocaleString()}</td>
                <td>{D.apMin[i].toLocaleString()}</td>
                <td style={{ color: isExtra ? "var(--amber2)" : "var(--t5)", fontWeight: isExtra ? 600 : 400 }}>
                  {isExtra ? D.dirExtra[i].toLocaleString() : "—"}
                </td>
                <td style={{ color: done ? "var(--green2)" : "var(--t1)", fontWeight: done ? 600 : 400 }}>
                  {done ? "0 ✓" : D.dirBal[i].toLocaleString()}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${done ? "badge-done" : isExtra ? "badge-extra" : i === 7 ? "badge-warn" : ""}`} style={{ fontSize: 10 }}>
                    {D.phase[i]}
                  </span>
                  {st && (
                    <span className={`badge ${st.allOk ? "badge-pass" : "badge-fail"}`} style={{ marginLeft: 4, fontSize: 9 }}>
                      {st.passed}/{st.checked}
                    </span>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
