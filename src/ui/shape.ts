/**
 * The scale silhouette used by every project mount: a short narrow neck (the pedicel that
 * sits in the socket) widening into a body that ends in a scalloped tip — the outline of a
 * real butterfly scale.
 *
 * Points are generated in "scale space" (l = 0 at the stalk … 1 at the tips, w = −0.5 …
 * 0.5 across) and mapped to percentages for a CSS clip-path.
 */
export type Orientation = 'landscape' | 'portrait';

interface P { l: number; w: number }

const TEETH = 4;
const POINTS_PER_TOOTH = 8;
/** Where the scallops begin; their depth is ~3.5% of the length. */
const TIP = 0.965;

function halfWidth(l: number) {
  if (l < 0.025) return 0.075;
  const t = Math.min(Math.max((l - 0.025) / 0.12, 0), 1);
  const shoulder = Math.sin((t * Math.PI) / 2);
  const taper = 1 - 0.04 * Math.min(Math.max((l - 0.55) / 0.4, 0), 1);
  return (0.075 + (0.5 - 0.075) * Math.pow(shoulder, 0.8)) * taper;
}

const SIDE_L = [0, 0.025, 0.032, 0.045, 0.06, 0.08, 0.1, 0.125, 0.15, 0.25, 0.45, 0.65, 0.8, 0.9, TIP];

function outline(): P[] {
  const pts: P[] = [];
  for (const l of SIDE_L) pts.push({ l, w: -halfWidth(l) });
  // rounded scallops across the tip
  const hw = halfWidth(TIP);
  const n = TEETH * POINTS_PER_TOOTH;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const bump = Math.pow(Math.abs(Math.sin(Math.PI * u * TEETH)), 0.55);
    pts.push({ l: TIP + (1 - TIP) * bump, w: -hw + u * hw * 2 });
  }
  for (const l of [...SIDE_L].reverse()) pts.push({ l, w: halfWidth(l) });
  return pts;
}

const OUTLINE = outline();

function toXY(l: number, w: number, o: Orientation): [number, number] {
  return o === 'landscape' ? [l * 100, (0.5 + w) * 100] : [(0.5 + w) * 100, (1 - l) * 100];
}

function fmt(points: [number, number][]) {
  return `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`;
}

/** CSS clip-path polygon of the scale. */
export function scalePolygon(o: Orientation): string {
  return fmt(OUTLINE.map((p) => toXY(p.l, p.w, o)));
}

/**
 * Proportions of a mount that hugs its cover: the image takes 88% of the width and the
 * band between the scallops (top 9%) and the shoulder (bottom 16%).
 */
export const MOUNT_WINDOW = { top: 0.09, bottom: 0.16, side: 0.06 };
export function mountAspect(imageAspect: number) {
  return imageAspect * (1 - MOUNT_WINDOW.top - MOUNT_WINDOW.bottom) / (1 - 2 * MOUNT_WINDOW.side);
}
