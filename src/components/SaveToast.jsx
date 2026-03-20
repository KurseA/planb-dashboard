import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function SaveToast({ lastSaved }) {
  const [show, setShow] = useState(false);
  const [first, setFirst] = useState(true);

  useEffect(() => {
    if (first) { setFirst(false); return; }
    if (!lastSaved) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [lastSaved]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "var(--green)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "var(--thai)",
            zIndex: 100,
            boxShadow: "0 4px 20px rgba(29,158,117,0.3)"
          }}
        >
          บันทึกแล้ว ✓
        </motion.div>
      )}
    </AnimatePresence>
  );
}
