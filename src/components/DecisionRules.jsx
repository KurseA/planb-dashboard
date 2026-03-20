import { motion } from "framer-motion";

const rules = [
  { color: "var(--blue)", title: "Sales ≥ เป้าครึ่งเดือน", icon: "📊", desc: "ยอดขายสะสม 15 วันแรก ≥ 50% ของเป้าเดือน" },
  { color: "var(--green2)", title: "Cash ≥ ขั้นต่ำ", icon: "💰", desc: "เงินสดปลายเดือน ≥ Cash min หลังหักโปะ" },
  { color: "var(--amber2)", title: "AR ≤ เพดาน", icon: "📑", desc: "ลูกหนี้ ≤ 1.5x ยอดขาย (DSO ≤ 45 วัน)" },
  { color: "var(--purple)", title: "AP ≥ พื้น", icon: "🤝", desc: "เจ้าหนี้ ≥ เป้า (DPO ≥ 35 วัน) อย่าจ่ายเร็วเกิน" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export default function DecisionRules() {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 12, fontFamily: "var(--thai)" }}>
        กฎตัดสินใจ (Decision rules)
      </div>
      <motion.div className="rules" variants={container} initial="hidden" animate="show">
        {rules.map((r, i) => (
          <motion.div
            key={i}
            className="rule-card"
            style={{ borderLeft: `3px solid ${r.color}` }}
            variants={item}
            whileHover={{ scale: 1.02, borderLeftWidth: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--t1)", marginBottom: 4, fontFamily: "var(--thai)" }}>
              {r.icon} {r.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.5, fontFamily: "var(--thai)" }}>
              {r.desc}
            </div>
          </motion.div>
        ))}
      </motion.div>
      <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--green-bg)", borderRadius: 8, border: "1px solid rgba(29,158,117,0.15)" }}>
        <div style={{ fontSize: 11, color: "var(--green3)", lineHeight: 1.7, fontFamily: "var(--thai)" }}>
          <strong>4/4 ผ่าน</strong> → โปะเต็มจำนวน &nbsp;|&nbsp;
          <strong>3/4 ผ่าน</strong> → โปะ 50% &nbsp;|&nbsp;
          <strong>≤ 2/4 ผ่าน</strong> → จ่ายปกติ 235,750 เท่านั้น &nbsp;|&nbsp;
          <strong style={{ color: "#FCA5A5" }}>ก.ค.-ส.ค.</strong> → ห้ามโปะเพิ่ม (cash dip season)
        </div>
      </div>
    </motion.div>
  );
}
