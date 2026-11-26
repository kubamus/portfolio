import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { split } from '../ui/split';

/**
 * Typographic motion. One rule everywhere: type never fades up — it *turns over*, like a
 * scale, through edge-on. Entrances rotate from −100°, exits continue to +95°.
 */
const IN = { rotateX: -100, opacity: 0, transformOrigin: '50% 60% -0.2em' };
const SHOWN = { rotateX: 0, opacity: 1 };
const OUT = { rotateX: 95, opacity: 0 };

function words(sel: string): HTMLElement[] {
  const el = document.querySelector<HTMLElement>(sel);
  return el ? split(el, 'words').words : [];
}

/** Splits every [data-split] element once (also used by reduced/compact modes for a11y labels). */
export function prepareType() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const mode = el.dataset.split === 'chars' ? 'chars' : 'words';
    split(el, mode, el.classList.contains('turn__title'));
  });
}

/** Opening: the name turns into place once its font is ready. */
export function playIntro(reduced: boolean) {
  const chars = [...document.querySelectorAll<HTMLElement>('.surface__name .split-char')];
  const rest = ['.surface__intro', '.surface__hint'];
  if (reduced) {
    gsap.set([...chars, ...rest], { opacity: 1 });
    return gsap.timeline();
  }
  return gsap.timeline({ delay: 0.15 })
    .fromTo(chars, { ...IN, transformOrigin: '50% 100% -0.15em' }, { ...SHOWN, duration: 1.5, ease: 'expo.out', stagger: { each: 0.055, from: 'start' } })
    .fromTo(rest, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 }, 0.7);
}

/** All scroll-linked type. Returns nothing; everything lives in the caller's gsap context. */
export function buildTextMotion() {
  const sticky = (trigger: string) => gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger, start: 'top top', end: 'bottom bottom', scrub: true },
  });

  // Surface: each line of the name lifts away like a scale
  const given = document.querySelector('.surface__given .split-word');
  const family = document.querySelector('.surface__family .split-word');
  gsap.timeline({ scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom 15%', scrub: true } })
    .to(given, { rotateX: 80, opacity: 0, y: -40, transformOrigin: '50% 0%', ease: 'power1.in' }, 0)
    .to('.surface__intro', { opacity: 0, y: -30, ease: 'power1.in' }, 0)
    .to(family, { rotateX: -80, opacity: 0, y: 30, transformOrigin: '50% 100%', ease: 'power1.in' }, 0.15)
    .to('.surface__hint', { opacity: 0, ease: 'none', duration: 0.25 }, 0);

  // Magnification
  const mTitle = words('.magnify__title');
  const mText = words('.magnify__text');
  const mScrim = document.querySelector<HTMLElement>('.magnify__scrim');
  gsap.set([...mTitle, ...mText], IN);
  if (mScrim) gsap.set(mScrim, { opacity: 0 });
  const mTl = sticky('#magnify')
    .to(mTitle, { ...SHOWN, stagger: 0.03, duration: 0.1 }, 0.2)
    .to(mText, { ...SHOWN, stagger: 0.004, duration: 0.08 }, 0.3)
    .to([...mTitle, ...mText], { ...OUT, stagger: 0.002, duration: 0.08 }, 0.74)
    .set({}, {}, 1);
  if (mScrim) {
    mTl
      .to(mScrim, { opacity: 1, duration: 0.12 }, 0.16)
      .to(mScrim, { opacity: 0, duration: 0.1 }, 0.72);
  }

  // Structure: the section drawing - words, then annotations, then the title block
  const sA = words('.structure__line:first-child');
  const sB = words('.structure__line + .structure__line');
  const sBody = [...document.querySelectorAll<HTMLElement>('.structure__col')].flatMap((p) => split(p, 'words').words);
  const notes = [...document.querySelectorAll<HTMLElement>('.note')];
  const block = document.querySelector('.structure__block');
  gsap.set([...sA, ...sB, ...sBody], IN);
  gsap.set(notes, { opacity: 0, x: -10 });
  gsap.set(block, { rotateX: -90, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1200 });
  sticky('#structure')
    .to(sA, { ...SHOWN, stagger: 0.02, duration: 0.07 }, 0.36)
    .to(sB, { ...SHOWN, stagger: 0.02, duration: 0.07 }, 0.42)
    .to(sBody, { ...SHOWN, stagger: 0.0016, duration: 0.06 }, 0.47)
    .to(notes, { opacity: 1, x: 0, stagger: 0.03, duration: 0.05 }, 0.55)
    .to(block, { rotateX: 0, opacity: 1, duration: 0.07 }, 0.58)
    .to([...sA, ...sB, ...sBody, ...notes], { ...OUT, stagger: 0.0008, duration: 0.05 }, 0.84)
    .to(block, { rotateX: 90, opacity: 0, duration: 0.05 }, 0.85)
    .set({}, {}, 1);

  // The turn — the title's letters are flipped per frame by TurnType; here only entrances
  const tWords = [...document.querySelectorAll<HTMLElement>('.turn__title .split-word')];
  const tText = words('.turn__text');
  gsap.set([...tWords, ...tText], IN);
  sticky('#turn')
    .to(tWords, { ...SHOWN, stagger: 0.012, duration: 0.07 }, 0.05)
    .to(tText, { ...SHOWN, stagger: 0.003, duration: 0.06 }, 0.76)
    .set({}, {}, 1);

  // Work
  const workChars = [...document.querySelectorAll<HTMLElement>('.work__title .split-word')];
  gsap.timeline({ scrollTrigger: { trigger: '.work__head', start: 'top 85%', end: 'top 25%', scrub: true } })
    .fromTo(workChars, { ...IN, transformOrigin: '50% 100%' }, { ...SHOWN, stagger: 0.08, duration: 0.5, ease: 'none' }, 0)
    .fromTo('.work__intro', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, 0.4);

  // Specimens settle into place as they arrive, hinged at the top like scales in a row
  ScrollTrigger.batch('.specimen, .empty, .index', {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch,
      { rotateX: 12, y: 60, opacity: 0, transformOrigin: '50% 0%', transformPerspective: 1600 },
      { rotateX: 0, y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,transformPerspective,opacity' }),
  });

  // Coda
  const cTitle = words('.coda__title');
  gsap.timeline({ scrollTrigger: { trigger: '#coda', start: 'top 60%', end: 'top 5%', scrub: true } })
    .fromTo(cTitle, IN, { ...SHOWN, stagger: 0.1, duration: 0.5 }, 0)
    .fromTo('.coda__link', { rotateX: -80, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1400 }, { rotateX: 0, opacity: 1, duration: 0.6 }, 0.2)
    .fromTo(['.coda__text', '.coda__contact'], { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.4 }, 0.5);
}

/**
 * The turn title's letters flip in lock-step with the scales under them: each letter
 * asks the stage how far the wave has travelled at its own screen position.
 */
export class TurnType {
  private chars: HTMLElement[];
  private centers: [number, number][] = [];
  private measured = false;
  private last: number[] = [];

  constructor() {
    this.chars = [...document.querySelectorAll<HTMLElement>('.turn__title .split-char')];
  }

  invalidate() {
    this.measured = false;
  }

  private measure() {
    const sticky = document.querySelector<HTMLElement>('#turn .act__sticky');
    const offset = sticky ? sticky.getBoundingClientRect().top : 0;
    this.centers = this.chars.map((c) => {
      const r = c.getBoundingClientRect();
      return [r.left + r.width / 2, r.top - offset + r.height / 2];
    });
    this.measured = true;
  }

  update(flipAt: (x: number, y: number) => number) {
    if (!this.measured) this.measure();
    for (let i = 0; i < this.chars.length; i++) {
      const [x, y] = this.centers[i];
      const s = Math.round(flipAt(x, y) * 200) / 200;
      if (s === this.last[i]) continue;
      this.last[i] = s;
      // the letter turns like a card: it flattens towards edge-on, then opens again as its
      // italic underside — never thinner than a sliver, so the line never has holes
      const el = this.chars[i];
      const squash = Math.max(Math.abs(Math.cos(s * Math.PI)), 0.14);
      el.style.transform = `scaleY(${squash.toFixed(3)})`;
      el.classList.toggle('is-under', s > 0.5);
    }
  }
}
