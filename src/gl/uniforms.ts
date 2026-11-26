import { Color, Matrix4, Vector3 } from 'three';
import { samplePalette } from './palettes';

/**
 * Uniform objects shared by every material. Materials spread this object into their own
 * `uniforms`, so one assignment per frame updates the whole stage.
 */
export const shared = {
  uCam: { value: new Vector3() },
  uTime: { value: 0 },
  uSwell: { value: 1 },
  uHazeTop: { value: new Color() },
  uHazeHorizon: { value: new Color() },
  uHazeBottom: { value: new Color() },
  uSunDir: { value: new Vector3(-0.45, 0.55, 0.7).normalize() },
  uSunCol: { value: new Color() },
  uFog: { value: 0.03 },
  uExposure: { value: 1 },
  uIrid0: { value: new Color() },
  uIrid1: { value: new Color() },
  uIrid2: { value: new Color() },
  uIrid3: { value: new Color() },
  uHueBase: { value: 0 },
  uHueSpread: { value: 1 },
  uHueVar: { value: 1 },
  uDim: { value: 0 },
  uInvViewProj: { value: new Matrix4() },
};

export function applyPalette(t: number) {
  const p = samplePalette(t);
  shared.uIrid0.value.copy(p.irid[0]);
  shared.uIrid1.value.copy(p.irid[1]);
  shared.uIrid2.value.copy(p.irid[2]);
  shared.uIrid3.value.copy(p.irid[3]);
  shared.uHueBase.value = p.hueBase;
  shared.uHueSpread.value = p.hueSpread;
  shared.uHueVar.value = p.hueVar;
  shared.uHazeTop.value.copy(p.hazeTop);
  shared.uHazeHorizon.value.copy(p.hazeHorizon);
  shared.uHazeBottom.value.copy(p.hazeBottom);
  shared.uSunCol.value.copy(p.sun);
  shared.uFog.value = p.fog;
  shared.uExposure.value = p.exposure;
  return p;
}
