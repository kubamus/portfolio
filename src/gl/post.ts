import {
  BufferGeometry, Color, DepthTexture, Float32BufferAttribute, HalfFloatType, LinearFilter, Mesh,
  OrthographicCamera, Scene, ShaderMaterial, Vector2, WebGLRenderTarget,
  type Camera, type PerspectiveCamera, type WebGLRenderer,
} from 'three';

/**
 * Macro-lens depth of field. The scene renders (with MSAA) into a half-float target;
 * this pass gathers a Vogel-disk bokeh whose radius follows a thin-lens circle of
 * confusion around the point the camera is looking at. `blur` adds a uniform softness
 * (used behind the gallery so the work stays in focus).
 */
const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
uniform float uFocus;
uniform float uAperture;
uniform float uBlur;
uniform float uMaxCoc;
uniform float uVignette;
uniform float uVeil;
uniform vec3 uVeilCol;
varying vec2 vUv;

float viewDist(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return -perspectiveDepthToViewZ(d, uNear, uFar);
}

float coc(vec2 uv) {
  float z = viewDist(uv);
  float c = uAperture * abs(1.0 - uFocus / max(z, 1e-3)) * uRes.y * 0.0125;
  return min(c + uBlur, uMaxCoc);
}

void main() {
  float c0 = coc(vUv);
  vec3 col;
  if (c0 < 0.6) {
    col = texture2D(tColor, vUv).rgb;
  } else {
    const int N = 22;
    vec3 sum = vec3(0.0);
    float wsum = 0.0;
    for (int i = 0; i < N; i++) {
      float r = sqrt((float(i) + 0.5) / float(N));
      float th = float(i) * 2.3999632;
      vec2 o = vec2(cos(th), sin(th)) * r * c0;
      vec2 suv = vUv + o / uRes;
      float cs = coc(suv);
      // a sample only contributes if its own blur reaches this pixel (no sharp halos)
      float w = clamp(cs - r * c0 + 1.0, 0.0, 1.0) + 0.02;
      sum += texture2D(tColor, suv).rgb * w;
      wsum += w;
    }
    col = sum / wsum;
  }
  vec2 q = vUv - 0.5;
  col *= 1.0 - uVignette * dot(q, q) * 1.6;
  // cuts between worlds close like lamellae: staggered vertical blinds, two clean colours
  if (uVeil > 0.0) {
    float x = vUv.x * 36.0;
    float h = fract(sin(floor(x) * 12.9898) * 43758.5453);
    float t = clamp(uVeil * 1.4 - h * 0.4, 0.0, 1.0);
    float cover = step(abs(fract(x) - 0.5) * 2.0, t);
    col = mix(col, uVeilCol, cover);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
}
`;

export class Post {
  private target: WebGLRenderTarget;
  private material: ShaderMaterial;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor() {
    this.target = new WebGLRenderTarget(2, 2, {
      type: HalfFloatType,
      samples: 4,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthTexture: new DepthTexture(2, 2),
    });
    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture },
        uRes: { value: new Vector2(2, 2) },
        uNear: { value: 0.01 },
        uFar: { value: 220 },
        uFocus: { value: 10 },
        uAperture: { value: 1 },
        uBlur: { value: 0 },
        uMaxCoc: { value: 18 },
        uVignette: { value: 0.35 },
        uVeil: { value: 0 },
        uVeilCol: { value: new Color() },
      },
      depthTest: false,
      depthWrite: false,
    });
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const quad = new Mesh(geo, this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  setSize(width: number, height: number) {
    this.target.setSize(width, height);
    this.material.uniforms.uRes.value.set(width, height);
    this.material.uniforms.uMaxCoc.value = Math.round(18 * (height / 1080));
  }

  setVeil(amount: number, color: Color) {
    this.material.uniforms.uVeil.value = amount;
    this.material.uniforms.uVeilCol.value.copy(color);
  }

  setVignette(v: number) {
    this.material.uniforms.uVignette.value = v;
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: Camera & PerspectiveCamera, focus: number, aperture: number, blur: number) {
    const u = this.material.uniforms;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uFocus.value = focus;
    u.uAperture.value = aperture;
    u.uBlur.value = blur * (u.uRes.value.y / 1080);
    renderer.setRenderTarget(this.target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.target.dispose();
    this.material.dispose();
  }
}
