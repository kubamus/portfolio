import {
  BufferGeometry, Float32BufferAttribute, HalfFloatType, LinearFilter, Mesh, OrthographicCamera,
  RGBAFormat, Scene, ShaderMaterial, Vector2, WebGLRenderTarget, type WebGLRenderer,
} from 'three';
import { brushFragment, brushVertex } from './shaders/screen';

/**
 * A small ping-pong field in wing space. RG = brushing direction, B = intensity.
 * The scales read it in their vertex shader. Frame-rate independent decay.
 */
export class Brush {
  private targets: [WebGLRenderTarget, WebGLRenderTarget];
  private material: ShaderMaterial;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private pending = { p0: new Vector2(), p1: new Vector2(), dir: new Vector2(), strength: 0 };
  /** Rough upper bound of what is left in the field; lets us skip work when it is empty. */
  private energy = 0;
  private cleared = false;

  constructor(size = 256) {
    const opts = { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false };
    this.targets = [new WebGLRenderTarget(size, size, opts), new WebGLRenderTarget(size, size, opts)];
    this.material = new ShaderMaterial({
      vertexShader: brushVertex,
      fragmentShader: brushFragment,
      uniforms: {
        uPrev: { value: null },
        uP0: { value: new Vector2() },
        uP1: { value: new Vector2() },
        uDir: { value: new Vector2() },
        uRadius: { value: 0.022 },
        uStrength: { value: 0 },
        uDecay: { value: 0.98 },
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

  get texture() {
    return this.targets[0].texture;
  }

  setRadius(r: number) {
    this.material.uniforms.uRadius.value = r;
  }

  /** Queue a stroke from p0 to p1 (field uv, 0..1). */
  stroke(p0: Vector2, p1: Vector2, strength: number) {
    const d = this.pending.dir.copy(p1).sub(p0);
    const len = d.length();
    if (len < 1e-5) return;
    d.divideScalar(len);
    this.pending.p0.copy(p0);
    this.pending.p1.copy(p1);
    this.pending.strength = Math.min(strength * (0.3 + 0.7 * Math.min(len * 70, 1.2)), 0.9);
  }

  update(renderer: WebGLRenderer, dt: number, decayPerSecond: number) {
    const s = this.pending.strength;
    if (s <= 0 && this.energy < 0.003) {
      if (!this.cleared) {
        for (const t of this.targets) { renderer.setRenderTarget(t); renderer.clear(); }
        renderer.setRenderTarget(null);
        this.cleared = true;
      }
      return;
    }
    this.cleared = false;
    const decay = Math.pow(decayPerSecond, dt);
    const u = this.material.uniforms;
    u.uPrev.value = this.targets[0].texture;
    u.uP0.value.copy(this.pending.p0);
    u.uP1.value.copy(this.pending.p1);
    u.uDir.value.copy(this.pending.dir);
    u.uStrength.value = s;
    u.uDecay.value = decay;
    renderer.setRenderTarget(this.targets[1]);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
    this.targets.reverse();
    this.energy = Math.min(this.energy * decay + s, 1.5);
    this.pending.strength = 0;
  }

  dispose() {
    this.targets.forEach((t) => t.dispose());
    this.material.dispose();
  }
}
