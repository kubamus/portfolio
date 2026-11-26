import {
  Color, DoubleSide, Group, InstancedBufferAttribute, InstancedBufferGeometry, Mesh,
  PlaneGeometry, ShaderMaterial, Vector2, Vector3, Vector4, type Texture,
} from 'three';
import { UNDERSIDE_PIGMENTS } from './palettes';
import { membraneFragment, membraneVertex, wingFragment, wingVertex } from './shaders/wing';
import { shared } from './uniforms';

export const FIELD_HALF = 28;

/** Where the empty gallery's bare sockets open in the wing (x, z, half-width, length). */
const CLEARINGS = [
  new Vector4(3.8, 1.6, 1.5, 4.6),
  new Vector4(-4.4, 7.6, 1.25, 3.8),
  new Vector4(2.2, 12.6, 1.1, 3.4),
];

/** The scale the magnification chapter lifts out of the wing. */
export const SPECIMEN_TARGET = new Vector2(0.45, -0.6);
export const FIELD_SIZE = FIELD_HALF * 2;

/** JS mirror of the GLSL `wingHeight` (chunks.ts) — used to keep the camera above the swell. */
export function wingHeight(x: number, z: number, time: number, swell: number) {
  return swell * 0.5 * (
    Math.sin(x * 0.16 + z * 0.1 + 0.35 * Math.sin(time * 0.21)) * 0.9 +
    Math.sin(-x * 0.07 + z * 0.21 + 0.4 * Math.sin(time * 0.17 + 1.3)) * 0.6 +
    Math.sin(x * 0.31 - z * 0.13 + 0.5 * Math.sin(time * 0.29 + 2.1)) * 0.3 +
    Math.sin(x * 0.52 + z * 0.34 + 0.6 * Math.sin(time * 0.23 + 0.7)) * 0.5 +
    Math.sin(-x * 0.27 + z * 0.61 + 0.7 * Math.sin(time * 0.19 + 2.6)) * 0.36);
}

/** Deterministic PRNG so the wing is the same wing on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Wing {
  readonly group = new Group();
  readonly material: ShaderMaterial;
  private membraneMaterial: ShaderMaterial;
  readonly count: number;
  /** Base position of the specimen scale. */
  readonly specimen: Vector2;

  constructor(brushTexture: Texture, density = 1) {
    const sx = 0.5 / Math.sqrt(density);
    const sz = 0.42 / Math.sqrt(density);
    const cols = Math.floor(FIELD_SIZE / sx);
    const rows = Math.floor(FIELD_SIZE / sz);
    const rand = mulberry32(1987);
    const base: number[] = [];
    const rnd: number[] = [];
    // Rows are laid from the far end towards the camera so overlapping tips stack like tiles.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = -FIELD_HALF + (c + 0.5 + (r % 2) * 0.5) * sx;
        let z = FIELD_HALF - (r + 0.5) * sz;
        // scale rows on a wing follow the curves of its veins
        x += Math.sin(z * 0.11) * 0.9 + (rand() - 0.5) * 0.05;
        z += Math.sin(x * 0.07) * 0.6 + (rand() - 0.5) * 0.04;
        base.push(x, z);
        rnd.push(rand(), rand(), rand(), rand());
      }
    }
    this.count = base.length / 2;
    // pick the real instance nearest the target, so exactly one scale is lifted
    let best = 0, bestD = Infinity;
    for (let i = 0; i < this.count; i++) {
      const d = (base[i * 2] - SPECIMEN_TARGET.x) ** 2 + (base[i * 2 + 1] - SPECIMEN_TARGET.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    // and move it exactly onto the target, so the camera script can frame it precisely
    base[best * 2] = SPECIMEN_TARGET.x;
    base[best * 2 + 1] = SPECIMEN_TARGET.y;
    this.specimen = SPECIMEN_TARGET.clone();

    const plane = new PlaneGeometry(1, 1, 2, 4);
    // shift so uv.y = 0 sits at the socket and the plane is centred across
    plane.translate(0, 0.5, 0);
    const geo = new InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.getAttribute('position'));
    geo.setAttribute('uv', plane.getAttribute('uv'));
    geo.setAttribute('aBase', new InstancedBufferAttribute(new Float32Array(base), 2));
    geo.setAttribute('aRand', new InstancedBufferAttribute(new Float32Array(rnd), 4));
    geo.instanceCount = this.count;

    this.material = new ShaderMaterial({
      vertexShader: wingVertex,
      fragmentShader: wingFragment,
      uniforms: {
        ...shared,
        uLen: { value: 1.0 },
        uWid: { value: 0.6 },
        uTilt: { value: 0.2 },
        uBrush: { value: brushTexture },
        uFieldMin: { value: new Vector2(-FIELD_HALF, -FIELD_HALF) },
        uFieldSize: { value: FIELD_SIZE },
        uBrushAmt: { value: 1 },
        uFront: { value: -1e4 },
        // screen-right is world −x: the wave travels left → right, slightly rising
        uFlipDir: { value: new Vector2(-0.88, 0.47).normalize() },
        uFlipWidth: { value: 4.5 },
        uWaveLift: { value: 1 },
        uSpecimen: { value: new Vector3(0, 0, 0) },
        uClear: { value: CLEARINGS },
        uClearAmt: { value: 0 },
        uBaseCol: { value: new Color() },
        uUnder: { value: UNDERSIDE_PIGMENTS.map((c) => new Color(c)) },
      },
      side: DoubleSide,
      alphaToCoverage: true,
    });
    const scales = new Mesh(geo, this.material);
    scales.frustumCulled = false;

    const membraneGeo = new PlaneGeometry(FIELD_SIZE * 4, FIELD_SIZE * 4, 160, 160);
    membraneGeo.rotateX(-Math.PI / 2);
    this.membraneMaterial = new ShaderMaterial({
      vertexShader: membraneVertex,
      fragmentShader: membraneFragment,
      uniforms: { ...shared, uMembrane: { value: new Color() }, uClear: { value: CLEARINGS }, uClearAmt: { value: 0 } },
    });
    const membrane = new Mesh(membraneGeo, this.membraneMaterial);
    membrane.frustumCulled = false;

    this.group.add(membrane, scales);
  }

  setSpecimen(amount: number) {
    const u = this.material.uniforms.uSpecimen.value as Vector3;
    u.set(this.specimen.x, this.specimen.y, amount);
  }

  /** How open the bare sockets are (0 = a complete wing). Only used while the gallery is empty. */
  setSockets(amount: number) {
    this.material.uniforms.uClearAmt.value = amount;
    this.membraneMaterial.uniforms.uClearAmt.value = amount;
  }

  setColors(base: Color, membrane: Color) {
    this.material.uniforms.uBaseCol.value.copy(base);
    this.membraneMaterial.uniforms.uMembrane.value.copy(membrane);
  }

  /**
   * Places the wave front. Progress 0 → every scale untouched, 1 → every scale turned.
   * Between 8% and 92% the front crosses what the camera sees (centred on cx, cz), so the
   * visible sweep keeps the same pace at any zoom; the rest happens off-screen.
   */
  setFlip(progress: number, viewHalfExtent: number, cx: number, cz: number, lift = 1, width = 1) {
    const u = this.material.uniforms;
    const dir = u.uFlipDir.value as Vector2;
    const w = Math.max(2.5, viewHalfExtent * 0.32) * width;
    u.uWaveLift.value = lift;
    const reach = FIELD_HALF * (Math.abs(dir.x) + Math.abs(dir.y)) + w * 2;
    const c = cx * dir.x + cz * dir.y;
    const a = c - viewHalfExtent - w;
    const b = c + viewHalfExtent + w;
    let front: number;
    if (progress <= 0) front = -reach - w;
    else if (progress >= 1) front = reach + w;
    else if (progress < 0.08) front = -reach + (a + reach) * (progress / 0.08);
    else if (progress > 0.92) front = b + (reach - b) * ((progress - 0.92) / 0.08);
    else front = a + (b - a) * ((progress - 0.08) / 0.84);
    u.uFront.value = front;
    u.uFlipWidth.value = w;
  }

  /** How far the wave has turned the scale at world point (x, z). */
  flipAtWorld(x: number, z: number) {
    const u = this.material.uniforms;
    const dir = u.uFlipDir.value as Vector2;
    const bend = Math.sin(z * 0.33 + 1.0) * 1.3 + Math.sin(x * 0.21 - 0.4) * 0.9;
    const proj = x * dir.x + z * dir.y + bend;
    return Math.min(Math.max((u.uFront.value - proj) / u.uFlipWidth.value, 0), 1);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
    this.material.dispose();
    this.membraneMaterial.dispose();
  }
}
