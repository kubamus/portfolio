import {
  BoxGeometry, Color, DoubleSide, Group, InstancedMesh, Matrix4, Mesh, PlaneGeometry, Quaternion,
  ShaderMaterial, Vector3,
} from 'three';
import { ridgeFragment, ridgeVertex } from './shaders/ridges';
import { shared } from './uniforms';

/** Ridge spacing; the corridor the camera flies through is centred at x = SPACING / 2. */
export const RIDGE_SPACING = 2.2;
const RIDGES = 17;
export const RIDGE_LENGTH = 96;
const LENGTH = RIDGE_LENGTH;
const LAMELLAE = 9;

/**
 * The nanostructure of a scale, scaled up into architecture: parallel ridges, each a
 * spine carrying stacked, alternating lamellae (the "Christmas tree" section of a
 * Morpho ridge), tied together by cross-ribs.
 */
export class Ridges {
  readonly group = new Group();
  private materials: ShaderMaterial[] = [];

  constructor() {
    const plaster = new Color();
    const make = (iridMask: number) => {
      const m = new ShaderMaterial({
        vertexShader: ridgeVertex,
        fragmentShader: ridgeFragment,
        uniforms: {
          ...shared,
          uPlaster: { value: plaster },
          uIridAmt: { value: 1 },
          uIridMask: { value: iridMask },
          uFrontZ: { value: -RIDGE_LENGTH / 2 },
          uDeep: { value: 0 },
        },
        side: DoubleSide,
      });
      this.materials.push(m);
      return m;
    };

    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    const zAxis = new Vector3(0, 0, 1);
    const x0 = -((RIDGES - 1) / 2) * RIDGE_SPACING;

    // spines
    const spineGeo = new BoxGeometry(1, 1, 1, 1, 1, 64);
    const spines = new InstancedMesh(spineGeo, make(0.35), RIDGES);
    for (let i = 0; i < RIDGES; i++) {
      p.set(x0 + i * RIDGE_SPACING, 0.82, 0);
      s.set(0.075, 1.64, LENGTH);
      spines.setMatrixAt(i, m.compose(p, q.identity(), s));
    }

    // lamellae — alternating sides, narrowing towards the top, tilted up and outwards
    const lamGeo = new BoxGeometry(1, 1, 1, 1, 1, 64);
    lamGeo.translate(0.5, 0, 0); // pivot at the spine
    const lam = new InstancedMesh(lamGeo, make(1), RIDGES * LAMELLAE * 2);
    let k = 0;
    for (let i = 0; i < RIDGES; i++) {
      const x = x0 + i * RIDGE_SPACING;
      for (let j = 0; j < LAMELLAE; j++) {
        for (const side of [-1, 1]) {
          const reach = 0.5 - j * 0.034;
          const y = 0.2 + j * 0.155 + (side > 0 ? 0.075 : 0);
          q.setFromAxisAngle(zAxis, side > 0 ? 0.2 : Math.PI - 0.2);
          p.set(x, y, 0);
          s.set(reach, 0.032, LENGTH);
          lam.setMatrixAt(k++, m.compose(p, q, s));
        }
      }
    }

    // cross-ribs near the floor
    const ribGeo = new BoxGeometry(1, 1, 1);
    const ribsPerGap = Math.floor(LENGTH / 1.1);
    const ribs = new InstancedMesh(ribGeo, make(0.15), (RIDGES - 1) * ribsPerGap);
    k = 0;
    for (let i = 0; i < RIDGES - 1; i++) {
      for (let j = 0; j < ribsPerGap; j++) {
        p.set(x0 + (i + 0.5) * RIDGE_SPACING, 0.07, -LENGTH / 2 + (j + 0.5) * 1.1 + (i % 2) * 0.4);
        s.set(RIDGE_SPACING, 0.05, 0.05);
        ribs.setMatrixAt(k++, m.compose(p, q.identity(), s));
      }
    }

    const floorGeo = new PlaneGeometry(RIDGES * RIDGE_SPACING + 40, LENGTH + 40);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new Mesh(floorGeo, make(0.0));
    // the far end of the structure, so its depths read as depth, not as sky
    const wallGeo = new PlaneGeometry(RIDGES * RIDGE_SPACING + 40, 8);
    wallGeo.translate(0, 4, LENGTH / 2);
    const wall = new Mesh(wallGeo, make(-1)); // −1 marks the wall: it dissolves into the haze

    for (const o of [spines, lam, ribs, floor, wall]) o.frustumCulled = false;
    this.group.add(floor, wall, ribs, spines, lam);
  }

  setColors(plaster: Color, irid: number, deep: number) {
    for (const m of this.materials) {
      m.uniforms.uPlaster.value.copy(plaster);
      m.uniforms.uIridAmt.value = irid;
      m.uniforms.uDeep.value = deep;
    }
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
    this.materials.forEach((m) => m.dispose());
  }
}
