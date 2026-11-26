/**
 * DEVELOPMENT-ONLY DEMONSTRATION FIXTURES.
 *
 * These are NOT my real projects. They exist only to see how the gallery behaves with
 * different amounts and shapes of content. They are loaded with `?fixtures=<set>` in the
 * dev server (or a build made with VITE_FIXTURES=true) and are never bundled into the
 * normal production build. Every entry is labelled "Demo" and every cover is stamped
 * "DEMO FIXTURE".
 */
import type { Project } from '../types';
import a from './covers/demo-a.svg?url';
import b from './covers/demo-b.svg?url';
import c from './covers/demo-c.svg?url';
import d from './covers/demo-d.svg?url';
import e from './covers/demo-e.svg?url';
import f from './covers/demo-f.svg?url';

const img = (src: string, w: number, h: number, alt: string) => ({ src, width: w, height: h, alt: `Demo fixture image: ${alt}` });

const NOTE = 'Demonstration fixture — not a real project.';

const base: Project[] = [
  {
    slug: 'demo-tidepool',
    title: 'Demo · Tidepool',
    summary: `${NOTE} A dashboard-shaped placeholder with a 16:10 cover.`,
    description: `${NOTE}\n\nThis entry exists so the gallery can be evaluated with a complete record: cover, screenshots, technologies, links, status and year.\n\nA second paragraph checks spacing in the detail view.`,
    cover: img(a, 1600, 1000, 'abstract dashboard'),
    screenshots: [img(f, 1500, 1000, 'abstract chart'), img(c, 1000, 1000, 'abstract grid')],
    technologies: ['TypeScript', 'Next.js', 'PostgreSQL'],
    category: 'Web app',
    year: 2026,
    status: 'live',
    repository: 'https://github.com/kubamus',
    website: 'https://example.com',
    featured: true,
    order: 1,
  },
  {
    slug: 'demo-lantern',
    title: 'Demo · Lantern',
    summary: `${NOTE} A 4:3 cover and only a repository link.`,
    cover: img(b, 1200, 900, 'abstract code editor'),
    technologies: ['Node', 'TypeScript'],
    category: 'CLI',
    year: 2025,
    status: 'in-progress',
    repository: 'https://github.com/kubamus',
    order: 2,
  },
  {
    slug: 'demo-quarry',
    title: 'Demo · Quarry',
    summary: `${NOTE} A square cover.`,
    cover: img(c, 1000, 1000, 'abstract grid'),
    technologies: ['React'],
    category: 'Library',
    year: 2025,
    status: 'experiment',
    order: 3,
  },
  {
    slug: 'demo-meadow',
    title: 'Demo · Meadow',
    summary: `${NOTE} A tall portrait (9:16) cover.`,
    cover: img(d, 900, 1600, 'abstract mobile screen'),
    technologies: ['React Native'],
    year: 2024,
    status: 'archived',
    website: 'https://example.com',
  },
  {
    slug: 'demo-estuary',
    title: 'Demo · Estuary',
    summary: `${NOTE} An ultra-wide (21:9) cover.`,
    cover: img(e, 2100, 900, 'abstract wide layout'),
    technologies: ['Rust', 'WebAssembly'],
    category: 'Experiment',
    year: 2026,
  },
];

const edge: Project[] = [
  {
    slug: 'demo-very-long-title',
    title: 'Demo · An unusually long project title that keeps going to test wrapping across several lines',
    summary: `${NOTE} No cover image at all — the gallery should generate a structural-color plate.`,
    technologies: ['TypeScript', 'Node', 'Redis', 'Docker', 'PostgreSQL', 'GraphQL', 'tRPC', 'Tailwind'],
    category: 'A category with a long name',
    year: '2023–2026',
    status: 'in-progress',
    repository: 'https://github.com/kubamus',
    featured: true,
  },
  { slug: 'demo-minimal', title: 'Demo · Minimal' },
  {
    slug: 'demo-broken-image',
    title: 'Demo · Broken image',
    summary: `${NOTE} The cover path does not exist; the plate must degrade gracefully.`,
    cover: { src: '/does-not-exist.webp', alt: 'missing' },
    year: 2026,
  },
  ...base.slice(3),
];

function many(): Project[] {
  const covers = [a, b, c, d, e, f];
  const dims: [number, number][] = [[1600, 1000], [1200, 900], [1000, 1000], [900, 1600], [2100, 900], [1500, 1000]];
  const words = ['Moss', 'Kelp', 'Lichen', 'Fern', 'Reed', 'Coral', 'Amber', 'Basalt', 'Delta', 'Thicket', 'Spore', 'Pollen', 'Canopy', 'Marsh'];
  return words.map((w, i) => ({
    slug: `demo-${w.toLowerCase()}`,
    title: `Demo · ${w}`,
    summary: NOTE,
    cover: i % 5 === 4 ? undefined : img(covers[i % 6], dims[i % 6][0], dims[i % 6][1], 'abstract'),
    technologies: ['TypeScript'],
    year: 2026 - (i % 4),
    status: (['live', 'in-progress', 'experiment', 'archived'] as const)[i % 4],
    featured: i === 0 || i === 7,
    repository: 'https://github.com/kubamus',
  }));
}

export const fixtureSets: Record<string, () => Project[]> = {
  none: () => [],
  one: () => [base[0]],
  several: () => base,
  many,
  edge: () => edge,
};
