/** GLSL shared by every material of the stage. */

export const noise = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
`;

/** The membrane's swell. Mirrored in JS by `wingHeight()` in gl/wing.ts — keep in sync. */
export const wingHeight = /* glsl */ `
uniform float uTime;
uniform float uSwell;
float wingHeight(vec2 p) {
  // standing swells that breathe in place, so compositions hold still
  return uSwell * 0.5 * (
      sin(p.x * 0.16 + p.y * 0.10 + 0.35 * sin(uTime * 0.21)) * 0.9
    + sin(-p.x * 0.07 + p.y * 0.21 + 0.4 * sin(uTime * 0.17 + 1.3)) * 0.6
    + sin(p.x * 0.31 - p.y * 0.13 + 0.5 * sin(uTime * 0.29 + 2.1)) * 0.3
    + sin(p.x * 0.52 + p.y * 0.34 + 0.6 * sin(uTime * 0.23 + 0.7)) * 0.5
    + sin(-p.x * 0.27 + p.y * 0.61 + 0.7 * sin(uTime * 0.19 + 2.6)) * 0.36);
}
vec3 wingNormal(vec2 p) {
  const float e = 0.04;
  float h = wingHeight(p);
  return normalize(vec3(-(wingHeight(p + vec2(e, 0.0)) - h) / e, 1.0, -(wingHeight(p + vec2(0.0, e)) - h) / e));
}
`;

export const rotate = /* glsl */ `
vec3 rotateAxis(vec3 v, vec3 k, float a) {
  float c = cos(a), s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}
`;

/** Atmosphere, structural-color ramp and final grading, shared by all lit materials. */
export const atmosphere = /* glsl */ `
uniform vec3 uCam;
uniform vec3 uHazeTop;
uniform vec3 uHazeHorizon;
uniform vec3 uHazeBottom;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uFog;
uniform float uExposure;
uniform vec3 uIrid0;
uniform vec3 uIrid1;
uniform vec3 uIrid2;
uniform vec3 uIrid3;
uniform float uHueBase;
uniform float uHueSpread;
uniform float uHueVar;

vec3 hazeColor(vec3 dir) {
  vec3 c = mix(uHazeHorizon, uHazeTop, smoothstep(0.0, 0.42, dir.y));
  c = mix(c, uHazeBottom, smoothstep(0.0, -0.55, dir.y));
  float sun = max(dot(dir, normalize(uSunDir)), 0.0);
  c += uSunCol * (pow(sun, 3.0) * 0.07 + pow(sun, 12.0) * 0.22 + pow(sun, 90.0) * 0.2);
  return c;
}

vec3 applyFog(vec3 col, vec3 worldPos) {
  vec3 d = worldPos - uCam;
  float dist = length(d);
  float f = 1.0 - exp(-pow(dist * uFog, 2.0));
  return mix(col, hazeColor(d / max(dist, 1e-4)), f);
}

/**
 * Cyclic structural-color ramp (four stops). Like real thin-film reflectance, intensity
 * dips between interference orders — jewel tones separated by darkness, never by khaki.
 */
vec3 structural(float t) {
  t = fract(t) * 4.0;
  float f = fract(t);
  vec3 a = uIrid3, b = uIrid0;
  if (t < 1.0) { a = uIrid0; b = uIrid1; }
  else if (t < 2.0) { a = uIrid1; b = uIrid2; }
  else if (t < 3.0) { a = uIrid2; b = uIrid3; }
  return mix(a, b, smoothstep(0.0, 1.0, f)) * (1.0 - 0.6 * sin(3.14159265 * f));
}

vec3 grade(vec3 col) {
  col *= uExposure;
  // gentle shoulder: keeps saturated highlights from clipping into flat white
  return col / (1.0 + max(col - 0.82, 0.0) * 0.9);
}

`;
