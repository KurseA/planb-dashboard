import { motion } from "framer-motion";
import { D, monthStatus, earlyWarningCheck } from "../data";

export default function MonthTabs({ month, actuals, onSelectMonth }) {
  return (
    <div className="month-tabs">
      {D.months.map((mo, i) => {
        const st = monthStatus(actuals, i);
        const ew = earlyWarningCheck(actuals, i);
        const isExtra = D.dirExtra[i] > 0;
        const active = i === month;

        const ewColor = { green: "var(--green)", yellow: "var(--amber)", red: "var(--red)", pending: null }[ew.signal];

        return (
          <motion.button
            key={i}
            className={`month-tab ${active ? "active" : ""} ${active && isExtra ? "extra" : ""}`}
            onClick={() => onSelectMonth(i)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {mo}
            {/* Early Warning dot (left) */}
            {ewColor && (
              <span
                className="dot"
                style={{ background: ewColor, right: st ? 10 : -3 }}
              />
            )}
            {/* Final Check dot (right) */}
            {st && (
              <span
                className="dot"
                style={{ background: st.allOk ? "var(--green)" : "var(--red)" }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
