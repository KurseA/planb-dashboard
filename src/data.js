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
  phase: ["ปกติ", "ปกติ", "โปะ 1.2M", "โปะ 1.2M", "ปกติ", "ปกติ", "ปกติ", "⚡ ระวัง cash", "โปะ 800K", "โปะ 100K", "หมดแล้ว!", "หมดแล้ว!"]
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

export function monthStatus(actuals, m) {
  const keys = ["sales", "cash", "ar", "ap"];
  const results = keys.map(k => checkMetric(actuals, m, k));
  if (results.every(r => r === null)) return null;
  const passed = results.filter(r => r === true).length;
  const checked = results.filter(r => r !== null).length;
  return { passed, checked, allOk: passed === checked && checked === 4, results };
}
