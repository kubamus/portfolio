/**
 * The scene snapshot: every number the WebGL stage needs from the choreography.
 * The choreography writes it, the stage reads it. Neither knows about the other.
 */
export interface SceneSnapshot {
  camX: number; camY: number; camZ: number;
  lookX: number; lookY: number; lookZ: number;
  fov: number;
  roll: number;
  /** Lens shift (fraction of the viewport) — composes like an architectural camera. */
  shiftX: number;
  shiftY: number;
  /** Palette position (fractional — palettes blend). See gl/palettes.ts */
  pal: number;
  /** Amplitude of the membrane's swell. */
  swell: number;
  /** Progress of the turn-over wave, 0 = top side, 1 = underside. */
  flip: number;
  /** 0 = wing world, 1 = ridge (nanostructure) world. Stepped, never blended. */
  world: number;
  /** Atmospheric veil used to cut invisibly between worlds. */
  veil: number;
  /** Darkens the field behind the gallery for legibility. */
  dim: number;
  /** How strongly the pointer brushes the scales. */
  brush: number;
  /** Strength of the ridge world's iridescence. */
  irid: number;
  /** Lens aperture for the depth of field (0 = pinhole). Focus is wherever the camera looks. */
  aperture: number;
  /** Uniform softness in px @1080p, independent of depth (behind the gallery). */
  blur: number;
  /** How high scales lift while the wave turns them (1 = full), and how wide the front is. */
  waveLift: number;
  waveWidth: number;
  /** 0..1: lifts one scale out of the wing, like a specimen held up to the lens. */
  specimen: number;
  /** 0..1: blends the camera into a near-orthographic elevation of the ridges. */
  elevation: number;
  /** Multiplies the palette's fog density. */
  fogMul: number;
  /** 0..1: how much the lens focus follows the pointer (a microscope's focus knob). */
  focusFollow: number;
  /** 0..1: how far the bare sockets of an empty gallery have opened in the wing. */
  sockets: number;
  /** 0..1: a low sun behind the field, drifting — glints over melanin. */
  lowSun: number;
}

export type SceneKey = keyof SceneSnapshot;

export const scene: SceneSnapshot = {
  camX: 0, camY: 2.6, camZ: -17,
  lookX: 0, lookY: 1.2, lookZ: -4,
  fov: 34,
  roll: 0,
  shiftX: 0,
  shiftY: 0,
  pal: 0,
  swell: 1,
  flip: 0,
  world: 0,
  veil: 0,
  dim: 0,
  brush: 1,
  irid: 1,
  aperture: 1,
  blur: 0,
  waveLift: 1,
  waveWidth: 1,
  specimen: 0,
  elevation: 0,
  fogMul: 1,
  focusFollow: 0,
  sockets: 0,
  lowSun: 0,
};

/** Properties that jump instead of interpolating. */
export const STEPPED: ReadonlySet<SceneKey> = new Set<SceneKey>(['world']);
