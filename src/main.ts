import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/instrument-sans/wdth.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/acts.css';
import './styles/work.css';
import './styles/sheet.css';
import './styles/fallback.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from './content/site';
import { loadProjects } from './content/load';
import { DESKTOP_QUERY, REDUCED_QUERY, detectEnv } from './core/env';
import { Scroll } from './core/scroll';
import { KEYS, REST_POINTS } from './scene/keys';
import { scene } from './scene/state';
import { buildTextMotion, playIntro, prepareType, TurnType } from './scene/text';
import { SceneTrack } from './scene/track';
import { Chrome } from './ui/chrome';
import { renderGallery } from './ui/gallery';
import { Sheet } from './ui/sheet';
import type { Stage } from './gl/stage';

const env = detectEnv();
const root = document.documentElement;
root.classList.toggle('fine-pointer', env.finePointer);

const scroll = new Scroll(env.reduced);
const track = new SceneTrack(KEYS);
const chrome = new Chrome(track);
const veil = document.querySelector<HTMLElement>('.veil');
const stageEl = document.querySelector<HTMLElement>('.stage')!;
const canvas = document.querySelector<HTMLCanvasElement>('.stage__canvas')!;

let stage: Stage | null = null;
let stageLoading: Promise<Stage | null> | null = null;
let desktopMotion = false;

/* ─── Content ──────────────────────────────────────────────────────────── */
const { projects, fixture } = await loadProjects();

if (site.contact.resumeUrl) {
  const c = document.querySelector<HTMLElement>('[data-contact]');
  if (c) {
    const a = document.createElement('a');
    a.href = site.contact.resumeUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Resume';
    c.append(a);
  }
}

if (fixture) {
  const badge = document.createElement('div');
  badge.className = 'fixture-badge';
  badge.textContent = `Demo fixtures: “${fixture}” — not real projects`;
  document.body.appendChild(badge);
}

prepareType();
const turnType = new TurnType();

/* ─── Project sheet & routing ──────────────────────────────────────────── */
let pushedSheet = false;
const sheet = new Sheet(document.querySelector<HTMLDialogElement>('#sheet')!, projects, env.reduced, {
  onOpen: () => scroll.lenis.stop(),
  onClose: () => scroll.lenis.start(),
  requestClose: () => {
    if (pushedSheet) {
      pushedSheet = false;
      history.back();
    } else {
      history.replaceState(null, '', '#work');
      sheet.close();
    }
  },
  requestOpen: (slug) => {
    history.replaceState({ sheet: slug }, '', `#work/${encodeURIComponent(slug)}`);
    sheet.open(slug, gallery.plates.get(slug) ?? null);
  },
});

const gallery = renderGallery(
  document.querySelector<HTMLElement>('[data-gallery]')!,
  document.querySelector<HTMLElement>('[data-count]'),
  projects,
  {
    open(slug, from) {
      if (sheet.isOpen) return;
      history.pushState({ sheet: slug }, '', `#work/${encodeURIComponent(slug)}`);
      pushedSheet = true;
      sheet.open(slug, from);
    },
  },
);

function parseHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [section, slug] = h.split('/');
  return { section: section || 'top', slug };
}

window.addEventListener('popstate', () => {
  const { slug } = parseHash();
  if (slug && sheet.slug !== slug) {
    pushedSheet = !!history.state?.sheet;
    sheet.open(slug, gallery.plates.get(slug) ?? null);
  } else if (!slug && sheet.isOpen) {
    pushedSheet = false;
    sheet.close();
  }
});

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-nav]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const id = a.dataset.nav!;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const y = sectionArrival(id);
  scroll.goTo(y, { reduced: env.reduced, veil });
  history.replaceState(null, '', id === 'top' ? location.pathname + location.search : `#${id}`);
  if (id === 'work') document.getElementById('work-title')?.focus({ preventScroll: true });
});

/** Arrive at the gallery with the turn already complete. */
function workArrival() {
  const s = track.section('work');
  return s ? s.top + innerHeight * 0.12 : 0;
}

/** Scroll destination for a section anchor, landing past intro veils on sticky acts. */
function sectionArrival(id: string) {
  if (id === 'top') return 0;
  if (id === 'work') return workArrival();
  if (desktopMotion) {
    if (id === 'structure') return track.resolve(['structure', 0.62]);
    if (id === 'coda') return track.resolve(['coda', 0.65]);
  }
  const target = document.getElementById(id);
  return target ? target.getBoundingClientRect().top + scroll.y : 0;
}

/* ─── Stage (WebGL), loaded only for capable desktop windows ───────────── */
function ensureStage(): Promise<Stage | null> {
  if (stage) return Promise.resolve(stage);
  if (!env.webgl) return Promise.resolve(null);
  stageLoading ??= import('./gl/stage').then(({ Stage }) => {
    try {
      stage = new Stage({ canvas, reduced: env.reduced });
    } catch (err) {
      console.warn('WebGL stage unavailable, using painted fallback.', err);
      root.classList.add('no-webgl');
      return null;
    }
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      root.classList.add('no-webgl');
      stage?.setActive(false);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      root.classList.remove('no-webgl');
      stage?.setActive(true);
    });
    stage.setEmptyGallery(projects.length === 0);
    requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.add('is-ready')));
    return stage;
  });
  return stageLoading;
}

/* ─── The frame: scroll → scene → chrome → stage, once per tick ────────── */
const reducedVeil = { v: 0 };
let restAct = 'top';

function sceneScrollY(y: number) {
  if (!env.reduced) return y;
  // reduced motion: hold each act's resting composition and cut between them
  if (chrome.current !== restAct && !gsap.isTweening(reducedVeil)) {
    const next = chrome.current;
    gsap.timeline()
      .to(reducedVeil, { v: 1, duration: 0.25, ease: 'none' })
      .add(() => { restAct = next; })
      .to(reducedVeil, { v: 0, duration: 0.35, ease: 'none' });
  }
  return track.resolve(REST_POINTS[restAct] ?? ['top', 0]);
}

function fallbackFlipAt(x: number) {
  const w = 0.28;
  const front = -w + scene.flip * (1 + 2 * w);
  return Math.min(Math.max((front - x / innerWidth) / w + 0.5, 0), 1);
}

scroll.onFrame((_time, dt) => {
  const y = scroll.y;
  chrome.update(y);
  track.apply(sceneScrollY(y));
  if (env.reduced) scene.veil = Math.max(scene.veil, reducedVeil.v);
  // the veils into and out of the structure are pale: keep the chrome legible on them
  root.classList.toggle('veil-light', scene.veil > 0.35 && (chrome.current === 'magnify' || chrome.current === 'structure'));
  if (desktopMotion || env.reduced) {
    if (chrome.current === 'turn' || chrome.current === 'structure' || chrome.current === 'work') {
      turnType.update(stage && !env.reduced ? (x, yy) => stage!.flipAt(x, yy) : (x) => (env.reduced ? scene.flip : fallbackFlipAt(x)));
    }
  }
  stage?.frame(dt);
});

/* ─── Media-dependent motion ───────────────────────────────────────────── */
const mm = gsap.matchMedia();
mm.add({ desktop: DESKTOP_QUERY, reduce: REDUCED_QUERY }, (ctx) => {
  const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
  if (!desktop) {
    stage?.setActive(false);
    return;
  }
  ensureStage().then((s) => s?.setActive(true));
  if (!reduce) {
    desktopMotion = true;
    buildTextMotion();
  }
  return () => {
    desktopMotion = false;
  };
});

/* ─── Layout measurement ───────────────────────────────────────────────── */
ScrollTrigger.addEventListener('refresh', () => {
  track.measure();
  turnType.invalidate();
});
let resizeTimer = 0;
window.addEventListener('resize', () => {
  stage?.resize();
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    track.measure();
    turnType.invalidate();
  }, 120);
});
track.measure();

/* ─── Arrival ──────────────────────────────────────────────────────────── */
const initial = parseHash();
if (initial.section !== 'top' || initial.slug) {
  const y = sectionArrival(initial.section);
  scroll.lenis.scrollTo(y, { immediate: true, force: true });
  ScrollTrigger.update();
  if (initial.slug) sheet.open(initial.slug, null);
} else if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
  scroll.lenis.scrollTo(0, { immediate: true, force: true });
}

const fontsReady = Promise.race([
  Promise.all([
    document.fonts.load('450 100px "Bodoni Moda Variable"'),
    document.fonts.load('italic 450 100px "Bodoni Moda Variable"'),
    document.fonts.load('400 16px "Instrument Sans Variable"'),
  ]),
  new Promise((r) => setTimeout(r, 2500)),
]);

fontsReady.then(async () => {
  ScrollTrigger.refresh();
  const s = await (matchMedia(DESKTOP_QUERY).matches ? ensureStage() : Promise.resolve(null));
  if (s) {
    chrome.update(scroll.y);
    track.apply(sceneScrollY(scroll.y));
    s.frame(0);
    stageEl.classList.add('is-ready');
  }
  playIntro(env.reduced || !matchMedia(DESKTOP_QUERY).matches);
  root.classList.add('is-loaded', 'fonts-ready');
  if (s && !env.reduced && scroll.y < 10 && env.finePointer) openingStroke(s);
});

/** One invisible hand brushes the wing once, so the color's dependence on angle is seen. */
async function openingStroke(s: Stage) {
  const { Vector2 } = await import('three');
  const p = new Vector2();
  const o = { t: 0 };
  gsap.to(o, {
    t: 1,
    duration: 2.6,
    delay: 0.5,
    ease: 'sine.inOut',
    onUpdate: () => {
      const t = o.t;
      p.set(-0.7 + t * 1.45, -0.32 + Math.sin(t * Math.PI) * 0.2 - t * 0.05);
      s.setScriptedPointer(p);
    },
    onComplete: () => s.setScriptedPointer(null),
  });
}

if (import.meta.env.DEV) {
  Object.assign(window, { __scene: scene, __scroll: scroll, __track: track, __stage: () => stage });
}
