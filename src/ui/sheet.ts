import { gsap } from 'gsap';
import type { Project, ProjectImage } from '../content/types';
import { STATUS_LABEL, generatedPlate } from './gallery';

export interface SheetHooks {
  onOpen(): void;
  onClose(): void;
  /** Called when the visitor asks to close; the router decides how (history.back etc.). */
  requestClose(): void;
  requestOpen(slug: string): void;
}

/**
 * The project sheet: a native modal <dialog> (focus trap, Esc, inert page for free).
 * Opening morphs the clicked scale into the first image of the sheet.
 */
export class Sheet {
  private dialog: HTMLDialogElement;
  private q = <T extends HTMLElement>(sel: string) => this.dialog.querySelector<T>(sel)!;
  private current: Project | null = null;
  private source: HTMLElement | null = null;
  private closing = false;

  constructor(dialog: HTMLDialogElement, private projects: Project[], private reduced: boolean, private hooks: SheetHooks) {
    this.dialog = dialog;
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      hooks.requestClose();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) hooks.requestClose();
    });
    this.q('[data-sheet-close]').addEventListener('click', () => hooks.requestClose());
    this.q('[data-sheet-prev]').addEventListener('click', () => this.step(-1));
    this.q('[data-sheet-next]').addEventListener('click', () => this.step(1));
    dialog.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) return;
      if (e.key === 'ArrowRight') this.step(1);
      if (e.key === 'ArrowLeft') this.step(-1);
    });
  }

  get isOpen() {
    return this.dialog.open;
  }

  get slug() {
    return this.current?.slug ?? null;
  }

  private step(d: number) {
    if (!this.current) return;
    const i = this.projects.indexOf(this.current) + d;
    const p = this.projects[i];
    if (p) this.hooks.requestOpen(p.slug);
  }

  open(slug: string, from: HTMLElement | null) {
    const p = this.projects.find((x) => x.slug === slug);
    if (!p) return false;
    const wasOpen = this.dialog.open;
    this.current = p;
    this.source = from;
    this.fill(p);
    if (wasOpen) {
      this.q('.sheet__scroll').scrollTop = 0;
      gsap.fromTo(this.q('.sheet__layout'), { opacity: 0 }, { opacity: 1, duration: this.reduced ? 0 : 0.45 });
      return true;
    }
    this.dialog.showModal();
    this.hooks.onOpen();
    this.q('.sheet__scroll').scrollTop = 0;
    const title = this.q('[data-sheet-title]');
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    this.animateIn(from);
    return true;
  }

  close() {
    if (!this.dialog.open || this.closing) return;
    this.closing = true;
    const done = () => {
      this.dialog.close();
      this.closing = false;
      gsap.set([this.dialog, this.q('.sheet__text'), this.q('.sheet__nav')], { clearProps: 'all' });
      this.hooks.onClose();
      const target = this.source?.closest('.specimen')?.querySelector<HTMLElement>('.specimen__title a');
      target?.focus({ preventScroll: true });
    };
    if (this.reduced) return done();
    gsap.timeline({ onComplete: done })
      .to([this.q('.sheet__text'), this.q('.sheet__nav')], { opacity: 0, duration: 0.25 })
      .to(this.dialog, { backgroundColor: 'rgba(239,228,207,0)', duration: 0.35 }, 0.05)
      .to(this.q('.sheet__media'), { opacity: 0, y: 30, duration: 0.35, ease: 'power2.in' }, 0);
  }

  private animateIn(from: HTMLElement | null) {
    const text = this.q('.sheet__text');
    const nav = this.q('.sheet__nav');
    const fig = this.q<HTMLElement>('.sheet__figure');
    if (this.reduced) return;
    const tl = gsap.timeline();
    tl.fromTo(this.dialog, { backgroundColor: 'rgba(239,228,207,0)' }, { backgroundColor: 'rgba(239,228,207,1)', duration: 0.55, ease: 'power2.out' }, 0);
    tl.fromTo([text, nav], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 }, 0.25);
    gsap.set(this.q('.sheet__media'), { clearProps: 'all' });
    if (from && fig) {
      const a = from.getBoundingClientRect();
      const b = fig.getBoundingClientRect();
      if (a.width > 0 && b.width > 0) {
        // the cover lifts out of its mount and settles into the sheet: same proportions,
        // so one uniform scale — nothing squashes on the way
        const k = a.width / b.width;
        tl.fromTo(fig, {
          x: a.left - b.left, y: a.top - b.top, scale: k, transformOrigin: '0 0',
        }, {
          x: 0, y: 0, scale: 1,
          duration: 0.95, ease: 'expo.inOut',
          onComplete: () => gsap.set(fig, { clearProps: 'transform' }),
        }, 0);
        const rest = [...this.dialog.querySelectorAll<HTMLElement>('.sheet__figure')].slice(1);
        if (rest.length) tl.fromTo(rest, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.55);
        return;
      }
    }
    tl.fromTo(this.q('.sheet__media'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.1);
  }

  private figure(img: ProjectImage | undefined, p: Project, index: number) {
    const f = document.createElement('figure');
    f.className = 'sheet__figure';
    if (img?.src) {
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = img.alt || `${p.title}, image ${index + 1}`;
      el.decoding = 'async';
      if (img.width && img.height) {
        el.width = img.width;
        el.height = img.height;
      }
      el.addEventListener('error', () => {
        f.classList.add('sheet__figure--generated');
        el.replaceWith(generatedPlate(p));
      }, { once: true });
      f.appendChild(el);
    } else {
      f.classList.add('sheet__figure--generated');
      f.appendChild(generatedPlate(p));
    }
    return f;
  }

  private fill(p: Project) {
    const media = this.q('[data-sheet-media]');
    media.replaceChildren(this.figure(p.cover, p, 0), ...(p.screenshots ?? []).map((s, i) => this.figure(s, p, i + 1)));

    const meta = this.q('[data-sheet-meta]');
    meta.replaceChildren(...[p.year, p.category, p.status ? STATUS_LABEL[p.status] : undefined]
      .filter((v) => v !== undefined && v !== '')
      .map((v) => Object.assign(document.createElement('span'), { textContent: String(v) })));

    this.q('[data-sheet-title]').textContent = p.title;

    const desc = this.q('[data-sheet-desc]');
    const body = p.description || p.summary || 'A description is on its way.';
    desc.replaceChildren(...body.split(/\n\s*\n/).map((t) => Object.assign(document.createElement('p'), { textContent: t.trim() })));

    const facts = this.q('[data-sheet-facts]');
    const rows: [string, string][] = [];
    if (p.technologies?.length) rows.push(['Built with', p.technologies.join(', ')]);
    if (p.category) rows.push(['Category', p.category]);
    if (p.year !== undefined && p.year !== '') rows.push(['Year', String(p.year)]);
    if (p.status) rows.push(['Status', STATUS_LABEL[p.status]]);
    facts.replaceChildren(...rows.map(([k, v]) => {
      const d = document.createElement('div');
      d.append(Object.assign(document.createElement('dt'), { textContent: k }), Object.assign(document.createElement('dd'), { textContent: v }));
      return d;
    }));
    facts.hidden = rows.length === 0;

    const links = this.q('[data-sheet-links]');
    const linkEls: HTMLElement[] = [];
    const mk = (href: string, label: string) => {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `${label} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span>`;
      linkEls.push(a);
    };
    if (p.website) mk(p.website, 'Visit the site');
    if (p.repository) mk(p.repository, 'Read the source');
    links.replaceChildren(...linkEls);
    links.hidden = linkEls.length === 0;

    const i = this.projects.indexOf(p);
    this.q<HTMLButtonElement>('[data-sheet-prev]').disabled = i <= 0;
    this.q<HTMLButtonElement>('[data-sheet-next]').disabled = i >= this.projects.length - 1;
    this.q('[data-sheet-pos]').textContent = `${i + 1} / ${this.projects.length}`;
  }
}
