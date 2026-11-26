import { atmosphere } from './chunks';

/**
 * The nanostructure: ridges with stacked lamellae, rendered as pale architecture.
 * Color appears only where the geometry turns the light — the whole point of the piece.
 */
export const ridgeVertex = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vLocalY;
void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  vec4 world = m * vec4(position, 1.0);
  // a living structure is never machined: a slow sinuous drift along each ridge
  float phase = m[3].x * 1.7;
  world.x += sin(world.z * 0.32 + phase) * 0.05 + sin(world.z * 0.9 + phase * 2.0 + uTime * 0.3) * 0.012;
  vWorld = world.xyz;
  vNormalW = normalize(mat3(m) * normal);
  vLocalY = world.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const ridgeFragment = /* glsl */ `
uniform vec3 uPlaster;
uniform float uIridAmt;
uniform float uIridMask;
uniform float uFrontZ;
uniform float uDeep;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vLocalY;
${atmosphere}
void main() {
  vec3 n = normalize(vNormalW);
  if (!gl_FrontFacing) n = -n;
  vec3 V = normalize(uCam - vWorld);
  vec3 L = normalize(uSunDir);
  float diff = max(dot(n, L), 0.0);
  float hemi = 0.55 + 0.45 * n.y;
  float ao = mix(0.32, 1.0, smoothstep(-0.05, 1.5, vLocalY));
  vec3 col = uPlaster * (0.42 * hemi + 0.62 * diff) * ao;

  float cosT = clamp(dot(n, V), 0.0, 1.0);
  vec3 Hh = normalize(L + V);
  float spec = pow(max(dot(n, Hh), 0.0), 34.0);
  float fres = pow(1.0 - cosT, 2.2);
  float hue = uHueBase + uHueSpread * (1.0 - cosT) + vLocalY * 0.22 + sin(vWorld.z * 0.15) * 0.06;
  vec3 irid = structural(hue);
  float k = uIridAmt * max(uIridMask, 0.0) * clamp(0.02 + 0.22 * fres * fres * fres + 1.3 * spec, 0.0, 1.0);
  col = mix(col, irid * (0.75 + 1.1 * spec) * mix(0.6, 1.0, ao), k);

  // in section, light only reaches the cut face; inside, only blue survives the structure
  float depth = vWorld.z - uFrontZ;
  float deep = smoothstep(0.12, 3.2, depth) * uDeep;
  vec3 deepCol = structural(uHueBase + 0.2 + vLocalY * 0.12) * (0.18 + 0.5 * exp(-depth * 0.18));
  col = mix(col, deepCol, deep * 0.94);
  // the far wall dissolves upwards into the sky, so the section has no hard horizon
  if (uIridMask < 0.0) col = mix(col, hazeColor(normalize(vWorld - uCam)), smoothstep(1.3, 3.4, vLocalY));

  col = applyFog(col, vWorld);
  gl_FragColor = vec4(grade(col), 1.0);
  #include <colorspace_fragment>
}
`;
