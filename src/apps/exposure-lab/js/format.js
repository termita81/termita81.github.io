export const num = (n) => (n < 0 ? "−" + -n : String(n));
export const formatFocus = (distance) =>
  distance == null
    ? "N/A"
    : Number.isFinite(distance)
      ? `${distance.toFixed(1)} m`
      : "∞";
export const signed = (n) =>
  n === 0 ? "0" : (n > 0 ? "+" : "−") + Math.abs(n);
export function verdict(delta) {
  // delta = scene EV - settings EV
  if (delta === 0) return "Correct exposure";
  const n = Math.abs(delta);
  return `${n} stop${n === 1 ? "" : "s"} ${delta < 0 ? "under" : "over"}`;
}
