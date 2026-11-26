import { Color } from 'three';

/**
 * Art-directed palettes. Each one borrows the structural (or pigment) colors of a real
 * organism. `irid` is a cyclic ramp that the thin-film shader walks through as the
 * viewing angle changes; everything else is the material and atmosphere around it.
 */
export interface PaletteDef {
  name: string;
  irid: [string, string, string, string];
  /** Where on the ramp a scale seen head-on sits, and how far grazing angles push it. */
  hueBase: number;
  hueSpread: number;
  /** How much individual scales and drifting color fields depart from the ramp. */
  hueVar: number;
  base: string;
  membrane: string;
  plaster: string;
  hazeTop: string;
  hazeHorizon: string;
  hazeBottom: string;
  sun: string;
  veil: string;
  fog: number;
  exposure: number;
}

const jewel: PaletteDef = {
  name: 'jewel beetle',
  // thin-film physics: head-on reads copper/gold, grazing angles shift to green and teal
  irid: ['#0c7c55', '#0b5a6a', '#c4502c', '#dcaa3c'],
  hueBase: 1.02,
  hueSpread: -0.82,
  hueVar: 0.62,
  base: '#120907',
  membrane: '#140b08',
  plaster: '#ece4d6',
  hazeTop: '#efdcc2',
  hazeHorizon: '#e3aa82',
  hazeBottom: '#b8724f',
  sun: '#ffe9c8',
  veil: '#f1d2b2',
  fog: 0.013,
  exposure: 1.0,
};

const morpho: PaletteDef = {
  name: 'morpho',
  irid: ['#0a1f86', '#1f5ef2', '#2bc0ec', '#3424b0'],
  hueBase: 0.1,
  hueSpread: 0.6,
  hueVar: 0.32,
  base: '#05060c',
  membrane: '#08080c',
  plaster: '#ece4d6',
  hazeTop: '#cfd8ea',
  hazeHorizon: '#9fb3d9',
  hazeBottom: '#2a3560',
  sun: '#f4f6ff',
  veil: '#e9ecf2',
  fog: 0.02,
  exposure: 1.0,
};

const plaster: PaletteDef = {
  name: 'architecture',
  irid: ['#1b3fc4', '#2a5ee6', '#1a3aa8', '#3b6cf0'],
  hueBase: 0.05,
  hueSpread: 1.1,
  hueVar: 0.5,
  base: '#2a2420',
  membrane: '#ddd3c3',
  plaster: '#efe7da',
  hazeTop: '#f5f1ea',
  hazeHorizon: '#efe6d8',
  hazeBottom: '#e2d6c4',
  sun: '#fff8ec',
  veil: '#efe8dc',
  fog: 0.032,
  exposure: 1.0,
};

const underside: PaletteDef = {
  name: 'underside',
  irid: ['#123a8c', '#2a6fd6', '#38b3c0', '#b8862f'],
  hueBase: 0.15,
  hueSpread: 0.8,
  hueVar: 0.5,
  base: '#0d0907',
  membrane: '#120c09',
  plaster: '#ece4d6',
  hazeTop: '#3a2619',
  hazeHorizon: '#4a3020',
  hazeBottom: '#24170f',
  sun: '#fff1dc',
  veil: '#2b1c13',
  fog: 0.012,
  exposure: 1.0,
};

const dawn: PaletteDef = {
  name: 'coda',
  irid: ['#0c7c55', '#0b5a6a', '#c4502c', '#dcaa3c'],
  hueBase: 1.0,
  hueSpread: -0.8,
  hueVar: 0.7,
  base: '#1a0e0a',
  membrane: '#140b08',
  plaster: '#ece4d6',
  hazeTop: '#f0dcc9',
  hazeHorizon: '#f4c49c',
  hazeBottom: '#c98262',
  sun: '#fff0d8',
  veil: '#f1d2b2',
  fog: 0.03,
  exposure: 1.0,
};

/**
 * The palettes in the order the journey visits them; the scene's `pal` value walks
 * along this path. (The Morpho palette appears twice: once on the way in, once for the
 * turn.)
 */
export const PALETTE_PATH: PaletteDef[] = [jewel, morpho, plaster, morpho, underside, dawn];

/** Pigments of the wing's underside — constant, never blended. */
export const UNDERSIDE_PIGMENTS = ['#140d0a', '#3a2317', '#8a4421', '#b8842e', '#5f5d2c', '#cbb894', '#2c5aa8'];

export interface PaletteColors {
  irid: Color[];
  hueBase: number;
  hueSpread: number;
  hueVar: number;
  base: Color; membrane: Color; plaster: Color;
  hazeTop: Color; hazeHorizon: Color; hazeBottom: Color;
  sun: Color; veil: Color;
  fog: number; exposure: number;
}

function toColors(p: PaletteDef): PaletteColors {
  return {
    irid: p.irid.map((c) => new Color(c)),
    hueBase: p.hueBase,
    hueSpread: p.hueSpread,
    hueVar: p.hueVar,
    base: new Color(p.base),
    membrane: new Color(p.membrane),
    plaster: new Color(p.plaster),
    hazeTop: new Color(p.hazeTop),
    hazeHorizon: new Color(p.hazeHorizon),
    hazeBottom: new Color(p.hazeBottom),
    sun: new Color(p.sun),
    veil: new Color(p.veil),
    fog: p.fog,
    exposure: p.exposure,
  };
}

const compiled = PALETTE_PATH.map(toColors);
const out = toColors(jewel);

/** Blends the palette path at position `t` (linear-space colors). Returns a shared object. */
export function samplePalette(t: number): PaletteColors {
  const max = compiled.length - 1;
  const x = Math.min(Math.max(t, 0), max);
  const i = Math.min(Math.floor(x), max - 1);
  const f = x - i;
  const a = compiled[i], b = compiled[i + 1];
  for (let k = 0; k < 4; k++) out.irid[k].copy(a.irid[k]).lerp(b.irid[k], f);
  for (const key of ['base', 'membrane', 'plaster', 'hazeTop', 'hazeHorizon', 'hazeBottom', 'sun', 'veil'] as const) {
    out[key].copy(a[key]).lerp(b[key], f);
  }
  out.hueBase = a.hueBase + (b.hueBase - a.hueBase) * f;
  out.hueSpread = a.hueSpread + (b.hueSpread - a.hueSpread) * f;
  out.hueVar = a.hueVar + (b.hueVar - a.hueVar) * f;
  out.fog = a.fog + (b.fog - a.fog) * f;
  out.exposure = a.exposure + (b.exposure - a.exposure) * f;
  return out;
}
