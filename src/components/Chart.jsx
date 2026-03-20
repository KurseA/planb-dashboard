import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { D } from "../data";

export default function Chart({ month, actuals }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  const updateWidth = useCallback(() => {
    if (containerRef.current) setWidth(containerRef.current.offsetWidth);
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);

  if (!width) {
    return (
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 14, fontFamily: "var(--thai)" }}>
          ภาพรวมทั้งปี — Cash vs หนี้กรรมการ
        </div>
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: 280 }} />
      </motion.div>
    );
  }

  const m = month;
  const H = 280;
  const pad = { l: 50, r: 20, t: 20, b: 30 };
  const cw = width - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const maxVal = 10000;

  const x = (i) => pad.l + (i / (D.months.length - 1)) * cw;
  const y = (v) => pad.t + ch - (v / maxVal) * ch;
  const barX = (i) => pad.l + (i / D.months.length) * cw + (cw / D.months.length) * 0.15;
  const barW = () => (cw / D.months.length) * 0.45;

  const cashPts = D.cashProj.map((c, i) => `${x(i)},${y(c)}`).join(" ");
  const minPts = D.cashMin.map((c, i) => `${x(i)},${y(c)}`).join(" ");

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 14, fontFamily: "var(--thai)" }}>
        ภาพรวมทั้งปี — Cash vs หนี้กรรมการ
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 3, background: "var(--green2)", borderRadius: 2, display: "inline-block" }} />
          <span style={{ color: "var(--t3)" }}>Cash คาดการณ์</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 3, background: "var(--blue)", borderRadius: 2, display: "inline-block" }} />
          <span style={{ color: "var(--t3)" }}>Cash จริง</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 3, background: "var(--red)", borderRadius: 2, display: "inline-block", opacity: 0.5 }} />
          <span style={{ color: "var(--t3)" }}>Cash ขั้นต่ำ</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "rgba(217,119,6,0.4)", borderRadius: 2, display: "inline-block" }} />
          <span style={{ color: "var(--t3)" }}>หนี้กรรมการ</span>
        </span>
      </div>
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: H }}>
        <svg width={width} height={H} style={{ display: "block" }}>
          {/* Grid lines */}
          {[0, 2000, 4000, 6000, 8000, 10000].map(v => (
            <g key={v}>
              <line x1={pad.l} y1={y(v)} x2={width - pad.r} y2={y(v)} stroke="#1a1a1a" strokeWidth={1} />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fill="#444" fontSize={9} fontFamily="JetBrains Mono">{v / 1000}M</text>
            </g>
          ))}

          {/* Selected highlight */}
          <rect x={barX(m) - 4} y={pad.t} width={barW() + 8} height={ch} rx={4} fill="rgba(29,158,117,0.06)" stroke="var(--green)" strokeWidth={0.5} strokeDasharray="3,3" />

          {/* Director balance bars */}
          {D.dirBal.map((b, i) => (
            <motion.rect
              key={i}
              x={barX(i)}
              y={y(b)}
              width={barW()}
              height={(b / maxVal) * ch}
              rx={3}
              fill="rgba(217,119,6,0.25)"
              stroke={D.dirExtra[i] > 0 ? "#D97706" : "none"}
              strokeWidth={D.dirExtra[i] > 0 ? 1 : 0}
              initial={{ height: 0, y: y(0) }}
              animate={{ height: (b / maxVal) * ch, y: y(b) }}
              transition={{ duration: 0.8, delay: i * 0.04 }}
            />
          ))}

          {/* Cash min dashed */}
          <polyline fill="none" stroke="var(--red)" strokeWidth={1} strokeDasharray="4,4" opacity={0.4} points={minPts} />

          {/* Cash projected line */}
          <motion.polyline
            fill="none"
            stroke="var(--green2)"
            strokeWidth={2}
            strokeLinejoin="round"
            points={cashPts}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />

          {/* Cash projected dots */}
          {D.cashProj.map((c, i) => (
            <g key={`proj-${i}`}>
              <motion.circle
                cx={x(i)} cy={y(c)} r={3} fill="var(--green2)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              />
              {(i === m || D.dirExtra[i] > 0) && (
                <text x={x(i)} y={y(c) - 10} textAnchor="middle" fill="var(--green2)" fontSize={9} fontWeight={500} fontFamily="JetBrains Mono">
                  {(c / 1000).toFixed(1)}M
                </text>
              )}
            </g>
          ))}

          {/* Actual cash dots */}
          {D.months.map((_, i) => {
            const val = parseFloat(actuals[i]?.cash || "");
            if (isNaN(val) || val <= 0) return null;
            return (
              <g key={`act-${i}`}>
                <motion.circle
                  cx={x(i)} cy={y(val)} r={4} fill="var(--blue)" stroke="#0a0a0a" strokeWidth={1.5}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05, type: "spring" }}
                />
                <text x={x(i)} y={y(val) - 10} textAnchor="middle" fill="var(--blue)" fontSize={9} fontWeight={500} fontFamily="JetBrains Mono">
                  {(val / 1000).toFixed(1)}M
                </text>
              </g>
            );
          })}

          {/* Month labels */}
          {D.months.map((mo, i) => (
            <text key={`label-${i}`} x={x(i)} y={H - 6} textAnchor="middle" fill={i === m ? "var(--green2)" : "var(--t4)"} fontSize={10} fontWeight={i === m ? 600 : 400} style={{ cursor: "pointer" }}>
              {mo.replace(".", "")}.
            </text>
          ))}
        </svg>
      </div>
    </motion.div>
  );
}
