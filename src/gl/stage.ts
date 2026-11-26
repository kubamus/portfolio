import {
  BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, PerspectiveCamera, Plane, Raycaster, Scene,
  ShaderMaterial, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { scene as snapshot, type SceneSnapshot } from '../scene/state';
import { Brush } from './brush';
import { Post } from './post';
import { RIDGE_LENGTH, RIDGE_SPACING, Ridges } from './ridges';
import { backdropFragment, backdropVertex } from './shaders/screen';
import { applyPalette, shared } from './uniforms';
import { FIELD_HALF, FIELD_SIZE, Wing, wingHeight } from './wing';

export interface StageOptions {
  canvas: HTMLCanvasElement;
  reduced: boolean;
}

const UP_Y = new Vector3(0, 1, 0);
const UP_Z = new Vector3(0, 0, 1);

/**
 * The single WebGL stage behind the page. It owns no timing of its own: `frame()` is
 * called from the shared GSAP ticker and renders whatever the scene snapshot says.
 */
export class Stage {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(34, 1, 0.01, 220);
  private scene = new Scene();
  private wing: Wing;
  private ridges: Ridges;
  private brush: Brush;
  private post = new Post();
  private reduced: boolean;
  private time = 0;
  private active = true;
  private width = 1;
  private height = 1;

  private dprMax: number;
  private dpr: number;
  private frameTimes: number[] = [];

  private pointer = new Vector2(-10, -10);
  private pointerPrevUv: Vector2 | null = null;
  private pointerMoved = false;
  private raycaster = new Raycaster();
  private plane = new Plane(new Vector3(0, 1, 0), 0);
  private hit = new Vector3();
  private tmpV = new Vector3();
  private tmpV2 = new Vector3();
  private invVP = new Matrix4();
  private sunSection = new Vector3(-0.35, 0.62, -0.72);
  private sunLow = new Vector3();
  private scripted: Vector2 | null = null;
  private pointerDist = 0;
  private focus = 10;

  constructor({ canvas, reduced }: StageOptions) {
    this.reduced = reduced;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.setClearColor(0x000000, 1);
    this.dprMax = Math.min(window.devicePixelRatio || 1, 1.75);
    this.dpr = this.dprMax;
    this.brush = new Brush(256);
    // fewer, larger scales on small integrated GPUs would be the next step; the field is
    // already sized so a mid-range laptop GPU holds up at 1.5 DPR.
    this.wing = new Wing(this.brush.texture, 1);
    this.ridges = new Ridges();

    const triangle = new BufferGeometry();
    triangle.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const backdrop = new Mesh(triangle, new ShaderMaterial({
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      uniforms: { ...shared },
      depthTest: false,
      depthWrite: false,
    }));
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -1;

    this.scene.add(backdrop, this.wing.group, this.ridges.group);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.resize();
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    this.pointer.set((e.clientX / this.width) * 2 - 1, -(e.clientY / this.height) * 2 + 1);
    this.pointerMoved = true;
  };

  /** Drive the brush from a script (the opening stroke) instead of the pointer. */
  setScriptedPointer(ndc: Vector2 | null) {
    this.scripted = ndc;
    if (!ndc) this.pointerPrevUv = null;
  }

  private emptyGallery = false;

  setEmptyGallery(empty: boolean) {
    this.emptyGallery = empty;
  }

  setActive(active: boolean) {
    this.active = active;
    if (active) this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.post.setSize(Math.round(this.width * this.dpr), Math.round(this.height * this.dpr));
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  /** Screen point (CSS px) → how far the turn-over wave has progressed there (0..1). */
  flipAt(x: number, y: number): number {
    const ndc = new Vector2((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.plane, this.tmpV)) return snapshot.flip;
    return this.wing.flipAtWorld(this.tmpV.x, this.tmpV.z);
  }

  /** How many bays of the ridge elevation fit the window (more on ultrawide). */
  static baysFor(aspect: number) {
    return aspect >= 2.1 ? 4 : 3;
  }

  private updateCamera(s: SceneSnapshot) {
    const cam = this.camera;
    let lift = 0;
    if (s.world < 0.5) lift = wingHeight(s.lookX, s.lookZ, this.time, s.swell);
    let { camX, camY, lookX, lookY } = s;
    let fovKey = s.fov;
    const e = s.world >= 0.5 ? s.elevation : 0;
    if (e > 0.001) {
      // near-orthographic section: exactly N bays across, the floor near the bottom edge
      const aspect = this.width / this.height;
      const bays = Stage.baysFor(aspect);
      const W = bays * RIDGE_SPACING;
      const visibleH = W / aspect;
      const D = Math.max(-RIDGE_LENGTH / 2 - s.camZ, 1);
      const fitFov = (2 * Math.atan(visibleH / 2 / D) * 180) / Math.PI;
      const cx = bays % 2 ? RIDGE_SPACING / 2 : 0;
      const cy = visibleH * 0.455;
      camX += (cx - camX) * e;
      lookX += (cx - lookX) * e;
      camY += (cy - camY) * e;
      lookY += (cy - lookY) * e;
      fovKey += (fitFov - fovKey) * e;
    }
    cam.position.set(camX, camY + lift, s.camZ);
    const target = this.tmpV2.set(lookX, lookY + lift, s.lookZ);
    const dir = this.tmpV.copy(target).sub(cam.position).normalize();
    const k = Math.min(Math.max((-dir.y - 0.75) / 0.23, 0), 1);
    cam.up.copy(UP_Y).lerp(UP_Z, k * k * (3 - 2 * k)).normalize();
    cam.lookAt(target);
    if (s.roll) cam.rotateZ(s.roll);
    // keep the horizontal field of view generous on narrower desktop windows
    const aspect = this.width / this.height;
    const fov = aspect < 1.5 && e < 0.5 ? fovKey * (1 + (1.5 - aspect) * 0.35) : fovKey;
    if (cam.fov !== fov) cam.fov = fov;
    if (s.shiftX || s.shiftY) {
      cam.setViewOffset(this.width, this.height, -s.shiftX * this.width, s.shiftY * this.height, this.width, this.height);
    } else if (cam.view) {
      cam.clearViewOffset();
    }
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  private updateBrush(dt: number) {
    const s = snapshot;
    const ndc = this.scripted ?? (this.pointerMoved ? this.pointer : null);
    this.pointerMoved = false;
    if (ndc && s.world < 0.5 && s.brush > 0.01) {
      this.raycaster.setFromCamera(ndc, this.camera);
      const ray = this.raycaster.ray;
      if (ray.intersectPlane(this.plane, this.hit)) {
        const dist = this.hit.distanceTo(this.camera.position);
        this.pointerDist = dist;
        if (dist < 60 && Math.abs(this.hit.x) < FIELD_HALF && Math.abs(this.hit.z) < FIELD_HALF) {
          const uv = new Vector2((this.hit.x + FIELD_HALF) / FIELD_SIZE, (this.hit.z + FIELD_HALF) / FIELD_SIZE);
          // brush radius follows what one sees: ~11% of the view height at that depth
          const radius = (dist * Math.tan((this.camera.fov * Math.PI) / 360) * 0.11) / FIELD_SIZE;
          if (this.pointerPrevUv && uv.distanceTo(this.pointerPrevUv) < 0.25) {
            this.brush.setRadius(Math.min(Math.max(radius, 0.008), 0.06));
            this.brush.stroke(this.pointerPrevUv, uv, s.brush);
          }
          this.pointerPrevUv = uv;
        } else this.pointerPrevUv = null;
      }
    }
    this.brush.update(this.renderer, dt, 0.55);
  }

  frame(dt: number) {
    if (!this.active) return;
    const s = snapshot;
    if (!this.reduced) this.time += dt;
    shared.uTime.value = this.time;
    shared.uSwell.value = s.swell;
    shared.uDim.value = s.dim;

    const pal = applyPalette(s.pal);
    shared.uFog.value = pal.fog * s.fogMul;
    this.wing.setColors(pal.base, pal.membrane);
    this.wing.setSpecimen(s.specimen);
    this.wing.setSockets(this.emptyGallery ? s.sockets : 0);
    // the section starts as lit plaster and only goes deep blue as it flattens into a drawing
    const e = s.elevation;
    this.ridges.setColors(pal.plaster, s.irid, e <= 0.6 ? 0 : (e - 0.6) / 0.4);
    // light: the section is lit from the viewer's side; the wing from behind the field, and in
    // the hero by a low sun drifting slowly sideways, so one band of scales catches it at a time
    if (s.world >= 0.5) shared.uSunDir.value.copy(this.sunSection).normalize();
    else {
      const az = Math.sin(this.time * 0.07) * 0.55;
      this.sunLow.set(az, 0.2, 0.9).normalize();
      shared.uSunDir.value.set(-0.45, 0.55, 0.7).normalize().lerp(this.sunLow, s.lowSun).normalize();
    }
    this.post.setVeil(s.veil, pal.veil);
    this.post.setVignette(0.35 + s.dim * 0.5);

    const inWing = s.world < 0.5;
    this.wing.group.visible = inWing && s.veil < 0.999;
    this.ridges.group.visible = !inWing && s.veil < 0.999;

    this.updateCamera(s);
    shared.uCam.value.copy(this.camera.position);
    this.invVP.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse).invert();
    shared.uInvViewProj.value.copy(this.invVP);

    const viewHalf = Math.max(this.camera.position.y, 2) * Math.tan((this.camera.fov * Math.PI) / 360) * Math.max(this.width / this.height, 1) * 1.15;
    this.wing.setFlip(s.flip, viewHalf, s.lookX, s.lookZ, s.waveLift, s.waveWidth);

    this.updateBrush(dt);
    // the lens focuses where the camera looks — or, like a microscope's knob, where you point
    let focus = this.camera.position.distanceTo(this.tmpV2);
    if (s.focusFollow > 0 && this.pointerDist > 0) focus += (this.pointerDist - focus) * s.focusFollow;
    this.focus += (focus - this.focus) * (1 - Math.exp(-dt * 4));
    if (!Number.isFinite(this.focus)) this.focus = focus;
    this.post.render(this.renderer, this.scene, this.camera, this.focus, s.aperture, s.blur);
    this.adaptQuality(dt);
  }

  /** Lowers the pixel ratio when frames run long; raises it again when there is headroom. */
  private adaptQuality(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    this.frameTimes.length = 0;
    let next = this.dpr;
    if (median > 1 / 42 && this.dpr > 0.75) next = Math.max(0.75, this.dpr - 0.25);
    else if (median < 1 / 58 && this.dpr < this.dprMax) next = Math.min(this.dprMax, this.dpr + 0.25);
    if (next !== this.dpr) {
      this.dpr = next;
      this.resize();
    }
  }

  get pixelRatio() {
    return this.dpr;
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointer);
    this.wing.dispose();
    this.ridges.dispose();
    this.brush.dispose();
    this.post.dispose();
    this.renderer.dispose();
  }
}
