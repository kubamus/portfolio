import { atmosphere } from './chunks';

/** Full-screen sky: the same haze function the fog uses, so the horizon is seamless. */
export const backdropVertex = /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

export const backdropFragment = /* glsl */ `
uniform mat4 uInvViewProj;
varying vec2 vNdc;
${atmosphere}
void main() {
  vec4 p = uInvViewProj * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(p.xyz / p.w - uCam);
  vec3 col = hazeColor(dir);
  gl_FragColor = vec4(grade(col), 1.0);
  #include <colorspace_fragment>
}
`;

/** Brush field: decays, then a soft capsule is stamped along the pointer's last segment. */
export const brushVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const brushFragment = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uP0;
uniform vec2 uP1;
uniform vec2 uDir;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
varying vec2 vUv;
void main() {
  vec4 prev = texture2D(uPrev, vUv) * uDecay;
  vec2 pa = vUv - uP0;
  vec2 ba = uP1 - uP0;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  float d = length(pa - ba * h);
  float f = exp(-(d * d) / (uRadius * uRadius)) * uStrength;
  prev.rg += uDir * f;
  prev.b += f;
  prev.b = min(prev.b, 1.25);
  float len = length(prev.rg);
  if (len > 1.4) prev.rg *= 1.4 / len;
  gl_FragColor = prev;
}
`;
