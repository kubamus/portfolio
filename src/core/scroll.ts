import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type FrameCallback = (time: number, dt: number) => void;

/**
 * One clock for everything: GSAP's ticker drives Lenis, ScrollTrigger (via Lenis'
 * scroll event) and every registered frame callback (the WebGL stage, chrome), in
 * that order, so the scene always renders the scroll position of the same frame.
 */
export class Scroll {
  readonly lenis: Lenis;
  private callbacks = new Set<FrameCallback>();
  private last = 0;

  constructor(reduced: boolean) {
    this.lenis = new Lenis({
      autoRaf: false,
      lerp: reduced ? 1 : 0.09,
      smoothWheel: !reduced,
      wheelMultiplier: 0.95,
      anchors: false,
    });
    this.lenis.on('scroll', ScrollTrigger.update);
    // Resize refreshes are driven explicitly (see main.ts) so measurements stay in sync.
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(this.tick);
  }

  private tick = (time: number) => {
    const dt = this.last ? Math.min(time - this.last, 0.1) : 1 / 60;
    this.last = time;
    this.lenis.raf(time * 1000);
    for (const cb of this.callbacks) cb(time, dt);
  };

  onFrame(cb: FrameCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  get y(): number {
    return this.lenis.scroll;
  }

  get limit(): number {
    return this.lenis.limit;
  }

  /** Scroll to an element or offset. Long journeys cut through a veil instead of flying. */
  goTo(target: HTMLElement | number, opts: { reduced: boolean; veil?: HTMLElement | null } = { reduced: false }) {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + this.lenis.scroll;
    const distance = Math.abs(y - this.lenis.scroll);
    const veil = opts.veil;
    if (opts.reduced || !veil || distance < innerHeight * 1.6) {
      this.lenis.scrollTo(y, { duration: opts.reduced ? 0 : 1.1, immediate: opts.reduced, force: true });
      return;
    }
    gsap.killTweensOf(veil);
    gsap.timeline()
      .to(veil, { autoAlpha: 1, duration: 0.32, ease: 'power2.in' })
      .add(() => {
        this.lenis.scrollTo(y, { immediate: true, force: true });
        ScrollTrigger.update();
      })
      .to(veil, { autoAlpha: 0, duration: 0.6, ease: 'power2.out', delay: 0.08 });
  }
}
