export const D = {
  months: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
  monthsEn: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  salesTarget: [5266, 5114, 7413, 7413, 4330, 5138, 7413, 3860, 5024, 7413, 7413, 4229],
  halfSales: [2633, 2557, 3707, 3707, 2165, 2569, 3707, 1930, 2512, 3707, 3707, 2115],
  cashProj: [4421, 5725, 7655, 8988, 5648, 5484, 4990, 2534, 3646, 4060, 3345, 4792],
  cashMin: [3758, 4866, 5500, 6500, 4000, 4000, 3500, 2200, 3000, 3500, 2800, 4000],
  arMax: [7899, 7671, 11120, 11120, 6495, 7707, 11120, 5791, 7536, 11120, 11120, 6344],
  apMin: [3697, 3590, 4500, 4500, 3000, 3600, 4500, 2700, 3500, 4500, 4500, 2900],
  dirBal: [4951, 4715, 3751, 2315, 2079, 1844, 1608, 1372, 336, 0, 0, 0],
  dirExtra: [0, 0, 1200, 1200, 0, 0, 0, 0, 800, 100, 0, 0],
  dirTotal: [236, 236, 1436, 1436, 236, 236, 236, 236, 1036, 336, 0, 0],
  phase: ["ปกติ", "ปกติ", "โปะ 1.2M", "โปะ 1.2M", "ปกติ", "ปกติ", "ปกติ", "⚡ ระวัง cash", "โปะ 800K", "โปะ 100K", "หมดแล้ว!", "หมดแล้ว!"],

  // --- Early Warning benchmarks (วันที่ 10) ---
  odMax: [11000, 10000, 8000, 8000, 10000, 10000, 10000, 12000, 10000, 9000, 9000, 9000],
  netBankMin: [-5000, -4000, -2000, -1000, -4000, -4000, -5000, -7000, -5000, -4000, -5000, -4000],
  backlogMin: [3160, 3068, 4448, 4448, 2598, 3083, 4448, 2316, 3014, 4448, 4448, 2537],

  // --- Cash Flow Visibility ---
  collectionDueMin: [3159, 3068, 4448, 4448, 2598, 3083, 4448, 2316, 3014, 4448, 4448, 2537],
  paymentDueMax: [3500, 3500, 3500, 3500, 3000, 3500, 3500, 3000, 3500, 3500, 3500, 3000],
};

export const STORAGE_KEY = "swc_planb_benchmark_v2";

export const TOTAL_DEBT = 5187;

export function fmt(n) {
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "M";
  return n.toLocaleString() + "K";
}

export function fmtFull(n) {
  return (n * 1000).toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function checkMetric(actuals, m, key) {
  const val = parseFloat(actuals[m]?.[key] || "");
  if (isNaN(val)) return null;
  if (key === "sales") return val >= D.halfSales[m];
  if (key === "cash") return val >= D.cashMin[m];
  if (key === "ar") return val <= D.arMax[m];
  if (key === "ap") return val >= D.apMin[m];
  return null;
}

export function earlyWarningCheck(actuals, m) {
  const a = actuals[m] || {};
  const checks = {
    od: a.od ? parseFloat(a.od) <= D.odMax[m] : null,
    netBank: a.netBank ? parseFloat(a.netBank) >= D.netBankMin[m] : null,
    backlog: a.backlog ? parseFloat(a.backlog) >= D.backlogMin[m] : null,
  };
  const filled = Object.values(checks).filter(v => v !== null);
  const passed = filled.filter(v => v === true).length;
  let signal = "pending";
  if (filled.length >= 2) {
    if (passed >= 3) signal = "green";
    else if (passed >= 2) signal = "yellow";
    else signal = "red";
  }
  return { checks, passed, total: filled.length, signal };
}

export function payoffDecision(actuals, m) {
  const extra = D.dirExtra[m];
  if (extra === 0) return { action: "regular", amount: 236 };

  const early = earlyWarningCheck(actuals, m);
  const final = monthStatus(actuals, m);

  if (early.signal === "red") return { action: "blocked", amount: 236, reason: "early-warning-red" };

  if (final && final.checked >= 3) {
    if (final.passed >= 4) return { action: "full", amount: extra };
    if (final.passed >= 3) return { action: "half", amount: Math.round(extra / 2) };
    return { action: "regular", amount: 236 };
  }

  return { action: "waiting", signal: early.signal };
}

export function monthStatus(actuals, m) {
  const keys = ["sales", "cash", "ar", "ap"];
  const results = keys.map(k => checkMetric(actuals, m, k));
  if (results.every(r => r === null)) return null;
  const passed = results.filter(r => r === true).length;
  const checked = results.filter(r => r !== null).length;
  return { passed, checked, allOk: passed === checked && checked === 4, results };
}
