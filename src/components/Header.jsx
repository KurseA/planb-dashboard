import { motion } from "framer-motion";

export default function Header({ onExport, onImport, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--green)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
            Sweetchew Financial Control
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--t1)", fontFamily: "var(--thai)" }}>
            Plan B Benchmark — โปะหนี้กรรมการ
          </h1>
          <div style={{ fontSize: 12, color: "var(--t4)", marginTop: 4 }}>
            เป้าหมาย: ปิดหนี้ 5.19M ภายใน ต.ค. 2569 | Half-month checkpoint
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={onExport}>↓ Export</button>
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            ↑ Import
            <input type="file" accept=".json" style={{ display: "none" }} onChange={e => onImport(e.target.files[0])} />
          </label>
          <button className="btn btn-red" onClick={onClear}>ล้างข้อมูล</button>
        </div>
      </div>
    </motion.div>
  );
}
