import type { SceneTrack } from '../scene/track';

const ACTS = ['top', 'magnify', 'structure', 'turn', 'work', 'coda'] as const;
type Act = (typeof ACTS)[number];

const CHAPTER: Record<Act, string> = {
  top: 'surface', magnify: 'magnify', structure: 'structure', turn: 'turn', work: 'work', coda: 'coda',
};

const NAV_FOR: Record<Act, string | null> = {
  top: 'top', magnify: 'top', structure: 'structure', turn: 'work', work: 'work', coda: 'coda',
};

/** The microscopy scale bar: a value, a name and a bar that grows as you magnify. */
function readout(act: Act, p: number): [string, string, number] {
  switch (act) {
    case 'top': return ['1 mm', 'Intro', 90 + p * 60];
    case 'magnify': return p < 0.5 ? ['100 µm', 'How I build', 60 + p * 2 * 110] : ['10 µm', 'How I build', 50 + (p - 0.5) * 2 * 120];
    case 'structure': return p < 0.45 ? ['1 µm', 'About', 60 + (p / 0.45) * 90] : ['200 nm', 'About', 70 + ((p - 0.45) / 0.55) * 80];
    case 'turn': return ['1 mm', 'In the open', 96];
    case 'work': return ['Life size', 'Work', 96];
    case 'coda': return ['1 mm', 'Contact', 96 - p * 30];
  }
}

/** Keeps <html data-chapter>, the nav's current item and the scale bar in sync with scroll. */
export class Chrome {
  private root = document.documentElement;
  private value = document.querySelector<HTMLElement>('.scalebar__value');
  private name = document.querySelector<HTMLElement>('.scalebar__name');
  private bar = document.querySelector<HTMLElement>('.scalebar__bar');
  private navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.chrome__nav a[data-section]')];
  private lastAct: Act | null = null;
  private lastValue = '';
  private lastNav: string | null | undefined;
  current: Act = 'top';

  constructor(private track: SceneTrack) {}

  update(y: number) {
    const mid = y + innerHeight * 0.5;
    let act: Act = 'top';
    for (const id of ACTS) {
      const s = this.track.section(id);
      if (s && mid >= s.top) act = id;
    }
    this.current = act;
    if (act !== this.lastAct) {
      this.lastAct = act;
      this.root.dataset.chapter = CHAPTER[act];
    }
    this.root.classList.toggle('past-surface', y > innerHeight * 0.55);

    const nav = NAV_FOR[act];
    if (nav !== this.lastNav) {
      this.lastNav = nav;
      for (const a of this.navLinks) a.setAttribute('aria-current', String(a.dataset.section === nav));
    }

    const s = this.track.section(act);
    let p = 0;
    if (s) {
      const range = s.height > innerHeight * 1.05 ? s.height - innerHeight : s.height;
      p = Math.min(Math.max((y - s.top) / range, 0), 1);
    }
    const [value, name, width] = readout(act, p);
    if (value + name !== this.lastValue && this.value && this.name) {
      this.lastValue = value + name;
      this.value.textContent = value;
      this.name.textContent = name;
    }
    this.bar?.style.setProperty('--bar', `${width.toFixed(1)}px`);
  }
}
