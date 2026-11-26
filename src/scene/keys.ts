import type { Key } from './track';

/**
 * The camera script. Positions are anchored to the document's acts ([id, fraction, vh]),
 * so the choreography re-fits itself on every resize. Palette positions walk the path in
 * gl/palettes.ts: 0 jewel · 1 morpho · 2 architecture · 3 morpho · 4 underside · 5 coda.
 *
 * World 0 is the wing; world 1 is the nanostructure. Every cut between worlds happens
 * behind a full veil, so it is never seen. Values hold between keys that repeat them.
 */

/** The specimen scale lifted in the magnification chapter (see gl/wing.ts). */
const SX = 0.45;
const SZ = -0.6;

export const KEYS: Key[] = [
  // ── Surface: a raking, low view across the living wing
  {
    at: ['top', 0],
    set: {
      camX: 0, camY: 2.7, camZ: -16, lookX: 0.5, lookY: 0.6, lookZ: -3, fov: 34, roll: 0,
      shiftX: 0, shiftY: 0, pal: 0, swell: 0.7, flip: 0, world: 0, veil: 0, dim: 0, brush: 1, irid: 1,
      aperture: 1.1, blur: 0, waveLift: 1, waveWidth: 1, specimen: 0, elevation: 0, fogMul: 1, focusFollow: 0.85, sockets: 0, lowSun: 1,
    },
  },
  // rising over it as the name turns away
  { at: ['top', 0.9], set: { camX: 0.5, camY: 5.4, camZ: -9.5, lookX: 0.4, lookY: 0, lookZ: -3, swell: 0.6, pal: 0.1, focusFollow: 0, lowSun: 0 }, ease: 'sine.inOut' },

  // ── Magnification: one scale rises out of the wing, then we enter it
  { at: ['magnify', 0.22], set: { camX: SX + 0.3, camY: 2.6, camZ: SZ - 2.3, lookX: SX, lookY: 0, lookZ: SZ, pal: 1, swell: 0.25, aperture: 1.4, specimen: 0 }, ease: 'sine.inOut' },
  { at: ['magnify', 0.5], set: { camX: SX + 0.85, camY: 1.3, camZ: SZ - 1.0, lookX: SX, lookY: 0.62, lookZ: SZ + 0.42, fov: 30, aperture: 2.1, specimen: 1, swell: 0.12, pal: 1, veil: 0 }, ease: 'sine.inOut' },
  { at: ['magnify', 0.7], set: { camX: SX - 0.55, camY: 1.18, camZ: SZ - 0.85, lookX: SX, lookY: 0.62, lookZ: SZ + 0.42, specimen: 1, veil: 0 }, ease: 'sine.inOut' },
  { at: ['magnify', 0.9], set: { camX: SX - 0.05, camY: 0.92, camZ: SZ + 0.05, lookX: SX, lookY: 0.6, lookZ: SZ + 0.5, fov: 26, veil: 1, pal: 1 }, ease: 'power2.in' },
  // CUT → the nanostructure, seen from above: its ridges read as the stripes of the scale
  { at: ['magnify', 0.94], set: { world: 1, camX: 1.1, camY: 15, camZ: -0.02, lookX: 1.1, lookY: 0, lookZ: 0, fov: 34, pal: 2, veil: 1, irid: 0.08, aperture: 0.4, specimen: 0, elevation: 0, fogMul: 1 } },

  // ── Structure: a dolly-zoom flattens the structure into a section drawing
  { at: ['structure', 0.0], set: { veil: 1, camY: 13 } },
  { at: ['structure', 0.1], set: { veil: 0, camY: 10, camZ: -1.5, elevation: 0, fogMul: 1, irid: 0.08 }, ease: 'power2.out' },
  { at: ['structure', 0.38], set: { camX: 1.1, camY: 2, camZ: -98, lookX: 1.1, lookY: 2, lookZ: -48, elevation: 1, fogMul: 0.05, irid: 0.5, aperture: 0.25 }, ease: 'power2.inOut' },
  { at: ['structure', 0.8], set: { camZ: -92, elevation: 1, fogMul: 0.05, pal: 2, veil: 0 }, ease: 'none' },
  // pushing into the section, where only blue light survives; the veil closes
  { at: ['structure', 0.95], set: { camZ: -50.5, elevation: 0.55, veil: 1, pal: 2, aperture: 0.8, fogMul: 0.05 }, ease: 'power2.in' },
  // CUT → the wing's top side, low and oblique
  { at: ['structure', 0.98], set: { world: 0, camX: 0.5, camY: 8, camZ: -10.5, lookX: 0, lookY: 0, lookZ: 1.5, fov: 34, pal: 3, swell: 0.25, veil: 1, roll: 0, aperture: 0.7, elevation: 0, fogMul: 1 } },

  // ── The turn: a wave rolls every scale over, seen at a low, banking angle
  { at: ['turn', 0.0], set: { veil: 1, pal: 3 } },
  { at: ['turn', 0.1], set: { veil: 0, camY: 7, camZ: -9.5 }, ease: 'power2.out' },
  { at: ['turn', 0.22], set: { flip: 0, roll: 0, pal: 3, waveLift: 1.8, waveWidth: 0.65 } },
  { at: ['turn', 0.86], set: { flip: 1, camX: -0.5, camY: 6.2, camZ: -8.5, lookX: -0.5, lookZ: 2, roll: -0.16, pal: 3.7 }, ease: 'none' },

  // ── Work: the underside, calm and readable
  { at: ['work', 0, -30], set: { camX: 0, camY: 11, camZ: -4, lookX: 0, lookY: 0, lookZ: 0.5, roll: -0.06, dim: 0, pal: 4, blur: 0, sockets: 0 }, ease: 'sine.inOut' },
  { at: ['work', 0, 40], set: { dim: 0.55, blur: 2, sockets: 1 }, ease: 'sine.inOut' },
  { at: ['work', 1], set: { camX: 1.5, camY: 10, camZ: 10, lookX: 1.2, lookY: 0, lookZ: 14, roll: 0, dim: 0.55, swell: 0.25, pal: 4, blur: 2 }, ease: 'none' },

  // ── Coda: a frozen, half-turned wave under an open sky
  { at: ['coda', 0, -50], set: { dim: 0.2, flip: 1, blur: 3, waveLift: 1, waveWidth: 1, sockets: 1 } },
  { at: ['coda', 0.2], set: { sockets: 0 } },
  {
    at: ['coda', 0.62],
    set: {
      flip: 0.5, camX: 3, camY: 2.4, camZ: -15, lookX: 0.5, lookY: 1.9, lookZ: -1, pal: 5, dim: 0, swell: 0.6, roll: 0,
      blur: 0, aperture: 1.1, waveLift: 0.4, waveWidth: 2.4, focusFollow: 0.85, lowSun: 1,
    },
    ease: 'sine.inOut',
  },
];

/** Where each act "rests" — used by the reduced-motion mode, which cuts instead of travelling. */
export const REST_POINTS: Record<string, [string, number, number?]> = {
  top: ['top', 0],
  magnify: ['magnify', 0.6],
  structure: ['structure', 0.6],
  turn: ['turn', 0.9],
  work: ['work', 0.2],
  coda: ['coda', 0.62],
};
