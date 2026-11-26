import { atmosphere, noise, rotate, wingHeight } from './chunks';


/**
 * One instance = one scale. Each scale sits in its socket on the swelling membrane,
 * tilts its tip up like a roof tile, leans and lifts where the pointer brushed it, and
 * rolls over on its long axis when the turn-over wave passes.
 */
export const wingVertex = /* glsl */ `
attribute vec2 aBase;
attribute vec4 aRand;

uniform float uLen;
uniform float uWid;
uniform float uTilt;
uniform sampler2D uBrush;
uniform vec2 uFieldMin;
uniform float uFieldSize;
uniform float uBrushAmt;
uniform float uFront;
uniform vec2 uFlipDir;
uniform float uFlipWidth;
uniform float uWaveLift;
uniform vec3 uSpecimen;     // base x, base z, amount
uniform vec4 uClear[3];     // bare sockets: centre x, z, half-width, length
uniform float uClearAmt;

varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vN;
varying vec3 vB;
varying vec4 vRand;
varying vec2 vBase;
varying float vLift;
varying float vHueOff;
varying float vRoll;

${noise}
${wingHeight}
${rotate}

/** 1 inside a bare-socket clearing: a scale-shaped patch where no scales have grown yet. */
float clearing(vec2 p) {
  float c = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 q = (p - uClear[i].xy);
    float v = q.y / uClear[i].w + 0.5;               // 0 socket → 1 tip, along +z
    float hw = uClear[i].z * mix(0.25, 1.0, smoothstep(0.0, 0.25, v));
    float inside = step(0.0, v) * step(v, 0.92 + 0.08 * abs(sin(q.x / uClear[i].z * 7.85))) * step(abs(q.x), hw);
    c = max(c, inside);
  }
  return c * uClearAmt;
}

void main() {
  vec2 p = aBase;
  float h = wingHeight(p);
  vec3 N = wingNormal(p);
  // scales grow away from the viewer, so a lifted tip turns its iridescent face towards you
  vec3 fwd = vec3(0.0, 0.0, 1.0);
  vec3 D = normalize(fwd - N * dot(fwd, N));

  // brushing: lift and lean in the stroke direction
  vec4 br = texture2D(uBrush, (p - uFieldMin) / uFieldSize);
  float bi = clamp(br.b, 0.0, 1.0) * uBrushAmt;
  float yaw = (aRand.x - 0.5) * 0.32;
  if (dot(br.rg, br.rg) > 1e-5) {
    vec3 dir = normalize(vec3(br.r, 0.0, br.g));
    dir = normalize(dir - N * dot(dir, N) + 1e-5);
    float ang = atan(dot(cross(D, dir), N), dot(D, dir));
    yaw += ang * clamp(length(br.rg), 0.0, 1.0) * 0.85 * uBrushAmt;
  }
  D = rotateAxis(D, N, yaw);
  // B = D x N keeps the plane's front face (+z local) on the top side of the wing
  vec3 B = normalize(cross(D, N));

  // the turn-over wave
  // the front is bent, never a ruler line (mirrored in Wing.flipAtWorld)
  float bend = sin(p.y * 0.33 + 1.0) * 1.3 + sin(p.x * 0.21 - 0.4) * 0.9;
  float proj = dot(p, uFlipDir) + bend + (aRand.y - 0.5) * uFlipWidth * 0.45;
  float s = clamp((uFront - proj) / uFlipWidth, 0.0, 1.0);
  float lift = sin(3.14159265 * s) * 1.2 * uWaveLift;
  float roll = 3.14159265 * smoothstep(0.15, 0.85, s);

  float size = 0.86 + aRand.z * 0.28;
  // the specimen: one scale lifted towards the lens, cupped a little more
  float spec = uSpecimen.z * (1.0 - step(0.06, length(p - uSpecimen.xy)));
  // bare sockets: scales inside a clearing have not grown
  size *= 1.0 - clearing(p);
  float x = position.x;          // -0.5 .. 0.5 across
  float v = uv.y;                // 0 at the socket, 1 at the toothed tip
  float lat = x * uWid * size;
  float along = v * uLen * size;
  float cupK = 0.32 + spec * 0.9;
  float cup = x * x * 4.0 * cupK * uWid * 0.25 + v * v * 0.05;
  vec3 local = B * lat + D * along + N * cup;
  vec3 n = normalize(N - B * (x * 8.0 * cupK * 0.25 / size));

  float tilt = uTilt + (aRand.w - 0.5) * 0.26 + bi * 0.38 + lift + spec * 0.55;
  local = rotateAxis(local, B, tilt);
  n = rotateAxis(n, B, tilt);
  vec3 Dt = rotateAxis(D, B, tilt);
  local = rotateAxis(local, Dt, roll);
  n = rotateAxis(n, Dt, roll);
  vec3 Bt = rotateAxis(B, Dt, roll);

  vec3 world = vec3(p.x, h, p.y) + local + N * (0.006 * aRand.y + 0.004 + spec * 0.28);
  vWorld = world;
  vN = n;
  vB = Bt;
  vUv = vec2(x + 0.5, v);
  vRand = aRand;
  vBase = p;
  vLift = bi;
  // slow-drifting fields of color across the wing: no two patches quite the same
  vHueOff = (vnoise(p * 0.075 + vec2(uTime * 0.012, -uTime * 0.008)) - 0.5) * 0.7;
  vRoll = s;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const wingFragment = /* glsl */ `
uniform vec3 uBaseCol;
uniform vec3 uUnder[7];
uniform float uDim;
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vN;
varying vec3 vB;
varying vec4 vRand;
varying vec2 vBase;
varying float vLift;
varying float vHueOff;
varying float vRoll;

${noise}
${atmosphere}

/** Signed distance (in uv units) to the outline of a stalked, toothed scale. */
float scaleShape(vec2 uv) {
  float x = uv.x - 0.5;
  float v = uv.y;
  float halfW = mix(0.085, 0.5, smoothstep(0.015, 0.28, v));
  halfW *= 1.0 - 0.07 * smoothstep(0.5, 0.95, v);
  float across = clamp(x / (2.0 * halfW) + 0.5, 0.0, 1.0);
  float tooth = abs(fract(across * 4.0) - 0.5) * 2.0;     // 1 at tooth points, 0 at notches
  float tip = 0.9 + 0.085 * pow(tooth, 1.6);
  return min(min(halfW - abs(x), tip - v), v);
}

/**
 * Underside pattern. Every scale carries one pigment — a mosaic, as real wings are — but
 * the features are large (an eyespot spans ~20 scales) and bone is kept to thin lines.
 */
vec3 underside(vec2 p) {
  float m = fbm(p * 0.05 + 3.1);
  float m2 = fbm(p * 0.12 - 7.7);
  vec3 col = mix(uUnder[1], uUnder[2], smoothstep(0.42, 0.72, m));
  col = mix(col, uUnder[0], smoothstep(0.62, 0.82, m2) * 0.6);
  col = mix(col, uUnder[4], smoothstep(0.62, 0.82, fbm(p * 0.03 - 2.0)) * 0.45);
  // one broad ochre band with a hairline of bone beside it
  float bandCoord = p.y * 0.08 + (fbm(p * 0.04) - 0.5) * 1.2;
  float bandD = abs(fract(bandCoord) - 0.5);
  col = mix(col, uUnder[3], (1.0 - smoothstep(0.03, 0.05, bandD)) * 0.85);
  col = mix(col, uUnder[5], 1.0 - smoothstep(0.004, 0.011, abs(bandD - 0.075)));
  // eyespots: a thin bone rim, ochre, soot, a blue pupil with one white highlight
  vec3 spots[4];
  spots[0] = vec3(-6.0, 1.0, 5.6);
  spots[1] = vec3(7.0, 13.5, 4.6);
  spots[2] = vec3(-2.5, 24.0, 4.8);
  spots[3] = vec3(5.5, -9.5, 4.0);
  for (int i = 0; i < 4; i++) {
    float R = spots[i].z;
    vec2 d = p - spots[i].xy;
    d.y *= 0.86;
    float r = length(d) / R;
    if (r < 1.0) {
      vec3 ring = uUnder[5];
      if (r < 0.95) ring = uUnder[3];
      if (r < 0.74) ring = uUnder[0];
      if (r < 0.4) ring = uUnder[6] * (0.8 + 0.4 * (1.0 - r / 0.4));
      if (length(d - vec2(-0.16, 0.14) * R) / R < 0.07) ring = uUnder[5];
      col = ring;
    }
  }
  return col;
}

void main() {
  float d = scaleShape(vUv);
  float aa = fwidth(d) * 0.9 + 1e-4;
  float mask = smoothstep(-aa, aa, d);
  if (mask < 0.02) discard;

  vec3 V = normalize(uCam - vWorld);
  vec3 L = normalize(uSunDir);
  vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 b = normalize(vB);
  // longitudinal ridges on each scale perturb the normal: fine, living striation
  float ridge = sin(vUv.x * 6.2831853 * 26.0 + vRand.y * 6.0);
  // fade the striation when a scale is small on screen, before it turns into moire
  float ridgeAmt = 0.13 * (1.0 - smoothstep(0.003, 0.012, fwidth(vUv.x)));
  vec3 nr = normalize(n + b * ridge * ridgeAmt);
  float cosT = clamp(dot(nr, V), 0.0, 1.0);
  vec3 Hh = normalize(L + V);
  // overlap: the socket end of each scale sits in the shadow of the one before it
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.55, vUv.y));
  float edge = smoothstep(0.0, 0.05, d);

  vec3 col;
  if (gl_FrontFacing) {
    float hue = uHueBase + uHueSpread * (1.0 - cosT) + ((vRand.x - 0.5) * 0.3 + vHueOff) * uHueVar + vLift * 0.5;
    vec3 irid = structural(hue);
    vec3 R = reflect(-V, nr);
    float envL = dot(hazeColor(R), vec3(0.2126, 0.7152, 0.0722));
    // color arrives as glints: a thin-film peak when the scale faces you, and the light's lobe
    float spec = pow(max(dot(nr, Hh), 0.0), 34.0);
    float glint = pow(max(dot(nr, Hh), 0.0), 160.0);
    float peak = smoothstep(0.84, 0.985, cosT + (vRand.w - 0.5) * 0.32);
    float fres = pow(1.0 - cosT, 2.0);
    float diff = max(dot(nr, L), 0.0);
    // melanin backing: near-black, warm
    col = uBaseCol * (0.22 + 0.55 * diff);
    col += irid * (spec * 3.6 + envL * 0.4 * fres + peak * 0.35);
    // chitin is still a dielectric: at grazing angles it mirrors a little sky
    float schlick = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
    col += hazeColor(R) * schlick * 0.14;
    col += uSunCol * glint * 0.8;
    // brushed scales flare: their new angle throws their structural color back at you
    col += structural(hue + 0.1) * vLift * (0.9 + spec * 1.5);
    col *= ao;
    col *= mix(0.6, 1.0, edge);
  } else {
    // sample a little inside each scale so ring edges soften instead of stair-stepping
    vec3 pig = underside(mix(vBase, vWorld.xz, 0.25)) * (0.9 + 0.2 * vRand.z);
    float diff = max(dot(n, L), 0.0);
    col = pig * (0.42 + 0.7 * diff) * ao;
    col += vec3(1.0, 0.94, 0.84) * pow(max(dot(nr, Hh), 0.0), 26.0) * 0.07;
    col *= mix(0.7, 1.0, edge);
    col = mix(col, col * 0.42, uDim);
  }

  // mid-roll, a scale stands edge-on to the light: the turning wave carries a seam of light
  col += uSunCol * pow(sin(3.14159265 * vRoll), 10.0) * 0.55;

  col = applyFog(col, vWorld);
  gl_FragColor = vec4(grade(col), mask);
  #include <colorspace_fragment>
}
`;

/** The membrane under the scales: only visible through gaps and during the turn. */
export const membraneVertex = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormalW;
${wingHeight}
void main() {
  vec2 p = position.xz;
  vec3 world = vec3(p.x, wingHeight(p) - 0.02, p.y);
  vWorld = world;
  vNormalW = wingNormal(p);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const membraneFragment = /* glsl */ `
uniform vec3 uMembrane;
uniform float uDim;
uniform vec4 uClear[3];
uniform float uClearAmt;
varying vec3 vWorld;
varying vec3 vNormalW;
${atmosphere}

float clearing(vec2 p) {
  float c = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 q = (p - uClear[i].xy);
    float v = q.y / uClear[i].w + 0.5;
    float hw = uClear[i].z * mix(0.25, 1.0, smoothstep(0.0, 0.25, v));
    float edge = min(min(hw - abs(q.x), v * uClear[i].w), (0.92 + 0.08 * abs(sin(q.x / uClear[i].z * 7.85)) - v) * uClear[i].w);
    c = max(c, smoothstep(-0.05, 0.25, edge));
  }
  return c * uClearAmt;
}

void main() {
  float diff = max(dot(normalize(vNormalW), normalize(uSunDir)), 0.0);
  vec3 col = uMembrane * (0.5 + 0.6 * diff);
  col = mix(col, col * 0.5, uDim);
  // glasswing: where no scales grew, the membrane is clear and the light comes through,
  // dotted with the empty sockets the scales will grow from
  float c = clearing(vWorld.xz);
  if (c > 0.0) {
    vec2 g = vWorld.xz / vec2(0.5, 0.42);
    g.x += 0.5 * mod(floor(g.y), 2.0);
    float ring = abs(length(fract(g) - 0.5) - 0.07);
    float dotMask = 1.0 - smoothstep(0.012, 0.03, ring);
    // clear membrane over darkness: a smooth, glassy window with a soft sheen across it
    float sheen = pow(0.5 + 0.5 * sin(vWorld.x * 0.35 - vWorld.z * 0.22), 6.0);
    vec3 glass = mix(vec3(0.016, 0.010, 0.007), vec3(0.06, 0.04, 0.028), sheen);
    glass += vec3(0.5, 0.36, 0.24) * dotMask * 0.35;
    col = mix(col, glass, c);
  }
  col = applyFog(col, vWorld);
  gl_FragColor = vec4(grade(col), 1.0);
  #include <colorspace_fragment>
}
`;
