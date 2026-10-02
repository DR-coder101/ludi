/**
 * CSS `linear-gradient(<deg>, …)` as SVG userSpace endpoints for a w×h box: the
 * gradient line runs through the centre and is long enough that the corners
 * land exactly on the first and last stops.
 */
export function cssGradientLine(deg: number, w: number, h: number) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return { x1: w / 2 - dx * half, y1: h / 2 - dy * half, x2: w / 2 + dx * half, y2: h / 2 + dy * half };
}
