import type { Project, ProjectStatus } from '../content/types';
import { site } from '../content/site';
import { mountAspect, scalePolygon } from './shape';

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: 'Live',
  'in-progress': 'In progress',
  experiment: 'Experiment',
  archived: 'Archived',
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  live: '#2f8f5b',
  'in-progress': '#c48a2c',
  experiment: '#2c5aa8',
  archived: '#8a7a6a',
};

/** Structural palettes for projects without an image: every project still grows a scale. */
const PLATE_PALETTES = [
  ['#0c7c55', '#0b5a6a', '#c4502c', '#dcaa3c'],
  ['#0a1f86', '#1f5ef2', '#2bc0ec', '#3424b0'],
  ['#1b3fc4', '#2a5ee6', '#14a39a', '#d9a73a'],
  ['#0e6a66', '#3aa06a', '#f0c157', '#d8602e'],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function generatedPlate(p: Pick<Project, 'slug' | 'title'>): HTMLElement {
  const h = hash(p.slug);
  const pal = PLATE_PALETTES[h % PLATE_PALETTES.length];
  const el = document.createElement('span');
  el.className = 'plate-generated';
  el.style.setProperty('--c1', pal[0]);
  el.style.setProperty('--c2', pal[1]);
  el.style.setProperty('--c3', pal[2]);
  el.style.setProperty('--c4', pal[3]);
  el.style.setProperty('--hue-a', `${(h >> 3) % 360}deg`);
  el.style.setProperty('--stripe', `${80 + ((h >> 7) % 20)}deg`);
  const letter = document.createElement('span');
  letter.setAttribute('aria-hidden', 'true');
  letter.textContent = p.title.replace(/^Demo · /, '').trim().charAt(0).toUpperCase();
  el.appendChild(letter);
  return el;
}

interface Slot { col: number; span: number; drop: string }

/** Rows of mounts, staggered like the rows of scales on a wing. */
const ROW_PATTERNS: Record<number, Slot[]> = {
  1: [{ col: 5, span: 4, drop: '0' }],
  2: [
    { col: 3, span: 3, drop: '0' },
    { col: 8, span: 3, drop: '14vh' },
  ],
  3: [
    { col: 2, span: 3, drop: '0' },
    { col: 6, span: 3, drop: '12vh' },
    { col: 10, span: 3, drop: '4vh' },
  ],
  4: [
    { col: 1, span: 3, drop: '0' },
    { col: 4, span: 3, drop: '11vh' },
    { col: 7, span: 3, drop: '3vh' },
    { col: 10, span: 3, drop: '14vh' },
  ],
};

function perRowFor(n: number) {
  return n <= 1 ? 1 : n === 2 ? 2 : n <= 6 ? 3 : 4;
}

/** Count-agnostic placement. Featured projects open a new row, a little larger. */
export function placeProjects(projects: Project[]): Slot[] {
  const pattern = ROW_PATTERNS[perRowFor(projects.length)];
  const out: Slot[] = [];
  let slot = 0;
  let featured = 0;
  for (const p of projects) {
    if (p.featured && pattern.length > 1) {
      out.push({ col: featured % 2 ? 8 : 2, span: 4, drop: '0' });
      featured++;
      slot = 0;
      continue;
    }
    out.push(pattern[slot]);
    slot = (slot + 1) % pattern.length;
  }
  return out;
}

function metaText(p: Project): string[] {
  const out: string[] = [];
  if (p.year !== undefined && p.year !== '') out.push(String(p.year));
  if (p.category) out.push(p.category);
  return out;
}

export interface GalleryCallbacks {
  open(slug: string, from: HTMLElement | null): void;
}

export interface RenderedGallery {
  plates: Map<string, HTMLElement>;
}

/** The screenshot window inside a mount keeps the image's own proportions (within reason). */
function windowAspect(w?: number, h?: number) {
  if (!w || !h) return 1.6;
  return Math.min(Math.max(w / h, 0.56), 2.2);
}

export function renderGallery(root: HTMLElement, countEl: HTMLElement | null, projects: Project[], cb: GalleryCallbacks): RenderedGallery {
  root.querySelectorAll(':scope > :not(noscript)').forEach((n) => n.remove());
  const plates = new Map<string, HTMLElement>();

  if (countEl) {
    countEl.textContent = projects.length === 0
      ? 'No projects listed yet'
      : projects.length === 1 ? '1 project' : `${projects.length} projects`;
  }

  if (projects.length === 0) {
    root.appendChild(renderEmpty());
    return { plates };
  }

  const list = document.createElement('ol');
  list.className = 'specimens';
  list.setAttribute('aria-label', 'Projects');
  const slots = placeProjects(projects);
  const shape = scalePolygon('portrait');

  projects.forEach((p, i) => {
    const slot = slots[i];
    const li = document.createElement('li');
    li.className = 'specimen';
    if (p.featured) li.classList.add('is-featured');
    li.style.setProperty('--col', String(slot.col));
    li.style.setProperty('--span', String(slot.span));
    li.style.setProperty('--drop', slot.drop);
    li.style.setProperty('--shape', shape);

    // the mount: a scale-shaped paper card that hugs its cover, scallops up, stalk down
    const mount = document.createElement('div');
    mount.className = 'specimen__mount';
    mount.dataset.orientation = 'portrait';
    const rim = document.createElement('span');
    rim.className = 'specimen__rim';
    rim.setAttribute('aria-hidden', 'true');
    const paper = document.createElement('div');
    paper.className = 'specimen__paper';

    const win = document.createElement('div');
    win.className = 'specimen__window';
    const setAspect = (ar: number) => {
      mount.style.setProperty('--mount-ar', mountAspect(ar).toFixed(4));
      li.classList.toggle('is-tall', ar < 0.95);
    };
    setAspect(windowAspect(p.cover?.width, p.cover?.height));
    if (p.cover?.src) {
      const img = document.createElement('img');
      img.src = p.cover.src;
      img.alt = '';
      img.loading = i < 3 ? 'eager' : 'lazy';
      img.decoding = 'async';
      if (p.cover.width && p.cover.height) {
        img.width = p.cover.width;
        img.height = p.cover.height;
      } else {
        img.addEventListener('load', () => setAspect(windowAspect(img.naturalWidth, img.naturalHeight)), { once: true });
      }
      img.addEventListener('error', () => img.replaceWith(generatedPlate(p)), { once: true });
      win.appendChild(img);
    } else {
      win.appendChild(generatedPlate(p));
    }

    // the label: a small typed slip pinned beneath the stalk, as in a specimen drawer
    const label = document.createElement('div');
    label.className = 'specimen__slip';
    const h3 = document.createElement('h3');
    h3.className = 'specimen__title';
    const a = document.createElement('a');
    a.href = `#work/${encodeURIComponent(p.slug)}`;
    a.textContent = p.title;
    h3.appendChild(a);
    label.appendChild(h3);
    const meta = metaText(p);
    if (meta.length || p.status) {
      const m = document.createElement('p');
      m.className = 'specimen__meta';
      for (const t of meta) m.append(Object.assign(document.createElement('span'), { textContent: t }));
      if (p.status) {
        const st = Object.assign(document.createElement('span'), { textContent: STATUS_LABEL[p.status], className: 'specimen__status' });
        st.style.setProperty('--status', STATUS_COLOR[p.status]);
        m.append(st);
      }
      label.appendChild(m);
    }
    if (p.summary) {
      label.appendChild(Object.assign(document.createElement('p'), { className: 'specimen__summary', textContent: p.summary }));
    }
    if (p.technologies?.length) {
      label.appendChild(Object.assign(document.createElement('p'), { className: 'specimen__tech', textContent: p.technologies.join(' · ') }));
    }

    paper.append(win);
    mount.append(rim, paper);
    const pin = document.createElement('span');
    pin.className = 'specimen__pin';
    pin.setAttribute('aria-hidden', 'true');
    li.append(mount, pin, label);

    // the rim is structural color: its hue follows the angle you approach it from
    mount.addEventListener('pointermove', (e) => {
      const r = mount.getBoundingClientRect();
      const t = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      mount.style.setProperty('--tilt', t.toFixed(3));
    });

    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      cb.open(p.slug, win);
    });

    list.appendChild(li);
    plates.set(p.slug, win);
  });

  root.appendChild(list);
  if (projects.length >= 4) root.appendChild(renderIndex(projects, cb, plates));
  return { plates };
}

function renderIndex(projects: Project[], cb: GalleryCallbacks, plates: Map<string, HTMLElement>) {
  const nav = document.createElement('nav');
  nav.className = 'index';
  nav.setAttribute('aria-label', 'Project index');
  const title = document.createElement('p');
  title.className = 'index__title';
  title.textContent = `Index, ${projects.length} projects`;
  const ol = document.createElement('ol');
  for (const p of projects) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#work/${encodeURIComponent(p.slug)}`;
    const name = document.createElement('span');
    name.className = 'index__name';
    name.textContent = p.title;
    const cells = [p.year ?? '', p.category ?? '', p.status ? STATUS_LABEL[p.status] : ''].map((v) => {
      const s = document.createElement('span');
      s.className = 'index__cell';
      s.textContent = String(v);
      return s;
    });
    a.append(name, ...cells);
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      cb.open(p.slug, plates.get(p.slug) ?? null);
    });
    li.appendChild(a);
    ol.appendChild(li);
  }
  nav.append(title, ol);
  return nav;
}

/** Empty collection: the wing itself shows bare sockets (see gl/wing.ts); here, direct copy and links. */
function renderEmpty() {
  const wrap = document.createElement('div');
  wrap.className = 'empty';
  wrap.innerHTML = `
    <p class="empty__title">Projects are coming soon.</p>
    <p class="empty__text">I am preparing selected project writeups for this page. You can check my public repositories on GitHub now, or email me to talk about a part-time role or gig.</p>
    <div class="empty__actions">
      <a class="empty__link" href="${site.github.url}" target="_blank" rel="noopener noreferrer"><span>Browse GitHub</span><span class="empty__arrow" aria-hidden="true">↗</span><span class="sr-only">, opens in a new tab</span></a>
      <a class="empty__link" href="mailto:${site.contact.email}"><span>Email me</span></a>
    </div>`;
  return wrap;
}
