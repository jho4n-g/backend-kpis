export const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
export const safeDiv = (a, b) => {
  const x = toNum(a, 0);
  const y = toNum(b, 0);
  return y === 0 ? 0 : x / y;
};
