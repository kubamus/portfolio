import { gsap } from 'gsap';
import { scene, STEPPED, type SceneKey, type SceneSnapshot } from './state';

/**
 * A keyframe anchored to the document, not to time:
 *   at: [sectionId, fraction, vhOffset?]
 * `fraction` runs across the section's scroll range (its height minus one viewport for
 * tall/sticky sections, its full height otherwise). Positions are re-measured on resize,
 * so the same choreography fits every desktop aspect ratio.
 */
export interface Key {
  at: [string, number, number?];
  set: Partial<SceneSnapshot>;
  /** Ease used when arriving at this key. */
  ease?: string;
}

interface Measured { top: number; height: number }

interface Track {
  pos: number[];
  val: number[];
  ease: ((t: number) => number)[];
}

const easeCache = new Map<string, (t: number) => number>();
function easeFn(name = 'sine.inOut') {
  let fn = easeCache.get(name);
  if (!fn) {
    fn = gsap.parseEase(name) as (t: number) => number;
    easeCache.set(name, fn);
  }
  return fn;
}

export class SceneTrack {
  private tracks = new Map<SceneKey, Track>();
  private sections = new Map<string, Measured>();
  /** Scroll positions (px) of every key, in order, after the last measure(). */
  positions: number[] = [];

  constructor(private keys: Key[]) {}

  measure() {
    this.sections.clear();
    const y = window.scrollY;
    document.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => {
      const r = el.getBoundingClientRect();
      this.sections.set(el.id, { top: r.top + y, height: r.height });
    });
    this.build();
  }

  section(id: string) {
    return this.sections.get(id);
  }

  /** Document scroll position for [section, fraction, vh]. */
  resolve([id, f, vh = 0]: [string, number, number?]): number {
    const s = this.sections.get(id);
    if (!s) return 0;
    const H = innerHeight;
    const range = s.height > H * 1.05 ? s.height - H : s.height;
    return s.top + f * range + (vh / 100) * H;
  }

  private build() {
    this.tracks.clear();
    const resolved = this.keys.map((k) => ({ k, pos: this.resolve(k.at) })).sort((a, b) => a.pos - b.pos);
    this.positions = resolved.map((r) => r.pos);
    for (const { k, pos } of resolved) {
      for (const prop of Object.keys(k.set) as SceneKey[]) {
        let t = this.tracks.get(prop);
        if (!t) this.tracks.set(prop, (t = { pos: [], val: [], ease: [] }));
        t.pos.push(pos);
        t.val.push(k.set[prop] as number);
        t.ease.push(easeFn(k.ease));
      }
    }
  }

  /** Writes the interpolated snapshot for scroll position `y` into `scene`. */
  apply(y: number, target: SceneSnapshot = scene) {
    for (const [prop, t] of this.tracks) {
      const n = t.pos.length;
      let v: number;
      if (y <= t.pos[0]) v = t.val[0];
      else if (y >= t.pos[n - 1]) v = t.val[n - 1];
      else {
        let i = 0;
        while (i < n - 2 && y >= t.pos[i + 1]) i++;
        if (STEPPED.has(prop)) v = t.val[i];
        else {
          const span = t.pos[i + 1] - t.pos[i];
          const u = span > 0 ? (y - t.pos[i]) / span : 1;
          v = t.val[i] + (t.val[i + 1] - t.val[i]) * t.ease[i + 1](u);
        }
      }
      target[prop] = v;
    }
  }
}
