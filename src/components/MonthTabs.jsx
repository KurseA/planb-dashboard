import { motion } from "framer-motion";
import { D, monthStatus } from "../data";

export default function MonthTabs({ month, actuals, onSelectMonth }) {
  return (
    <div className="month-tabs">
      {D.months.map((mo, i) => {
        const st = monthStatus(actuals, i);
        const isExtra = D.dirExtra[i] > 0;
        const active = i === month;

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
