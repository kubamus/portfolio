import { projects as realProjects } from './projects';
import type { Project } from './types';

export interface LoadedProjects {
  projects: Project[];
  /** Name of the demo fixture set in use, or null for my real projects. */
  fixture: string | null;
}

/** Real projects, sorted for display. Fixture sets only load in development. */
export async function loadProjects(): Promise<LoadedProjects> {
  const requested = new URLSearchParams(location.search).get('fixtures');
  if (requested && (import.meta.env.DEV || import.meta.env.VITE_FIXTURES === 'true')) {
    const { fixtureSets } = await import('./fixtures');
    const set = fixtureSets[requested];
    if (set) return { projects: sortProjects(set()), fixture: requested };
  }
  return { projects: sortProjects(realProjects), fixture: null };
}

export function sortProjects(list: Project[]): Project[] {
  const year = (p: Project) => (typeof p.year === 'number' ? p.year : parseInt(String(p.year ?? '').slice(-4), 10) || 0);
  return list
    .filter((p) => !p.hidden)
    .map((p, i) => ({ p, i }))
    .sort((A, B) => {
      const a = A.p, b = B.p;
      const ao = a.order ?? Number.POSITIVE_INFINITY;
      const bo = b.order ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      if (year(a) !== year(b)) return year(b) - year(a);
      return A.i - B.i;
    })
    .map(({ p }) => p);
}
