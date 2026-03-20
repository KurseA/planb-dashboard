import { motion } from "framer-motion";
import { D, fmt, TOTAL_DEBT } from "../data";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export default function MetricCards({ month }) {
  const m = month;
  const pctPaid = (TOTAL_DEBT - (D.dirBal[m] || 0)) / TOTAL_DEBT * 100;

  const cards = [
    {
      label: "ยอดหนี้เหลือ",
      value: fmt(D.dirBal[m]),
      sub: D.dirBal[m] === 0 ? "ปิดหนี้แล้ว!" : `เป้า ${D.months[m]}: ${fmt(D.dirBal[m])}`,
      accent: D.dirBal[m] === 0
    },
    {
      label: "ชำระแล้ว",
      value: `${pctPaid.toFixed(0)}%`,
      sub: `${fmt(TOTAL_DEBT - (D.dirBal[m] || 0))} จาก 5.19M`
    },
    {
      label: "โปะเพิ่มเดือนนี้",
      value: D.dirExtra[m] > 0 ? fmt(D.dirExtra[m]) : "—",
      sub: D.dirExtra[m] > 0 ? "ถ้า benchmark ผ่าน" : "จ่ายปกติ 236K"
    },
    {
      label: "Cash เป้าหมาย",
      value: fmt(D.cashProj[m]),
      sub: `ขั้นต่ำ ${fmt(D.cashMin[m])}`
    }
  ];

  return (
    <motion.div className="metrics" variants={container} initial="hidden" animate="show">
      {cards.map((c, i) => (
        <motion.div key={i} className={`metric ${c.accent ? "accent" : ""}`} variants={item} whileHover={{ scale: 1.03, borderColor: "var(--green)" }} transition={{ type: "spring", stiffness: 400 }}>
          <div className="metric-label">{c.label}</div>
          <div className="metric-value">{c.value}</div>
          <div className="metric-sub">{c.sub}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}
