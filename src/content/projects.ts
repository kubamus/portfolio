import type { Project } from './types';

/**
 * My projects — the single source of truth for the gallery.
 *
 * Intentionally empty for now while I prepare selected writeups. While this list is empty
 * the gallery renders its designed "bare sockets" state.
 *
 * To add a project, copy this template into the array (see README → "Adding a project"):
 *
 *   {
 *     slug: 'my-project',
 *     title: 'My Project',
 *     summary: 'One or two sentences about what it is.',
 *     description: 'Longer text for the detail view.\n\nA second paragraph.',
 *     cover: { src: '/projects/my-project/cover.webp', alt: 'Dashboard of My Project', width: 1600, height: 1000 },
 *     screenshots: [{ src: '/projects/my-project/2.webp', alt: 'Settings screen' }],
 *     technologies: ['TypeScript', 'Next.js', 'PostgreSQL'],
 *     category: 'Web app',
 *     year: 2026,
 *     status: 'live',
 *     repository: 'https://github.com/kubamus/my-project',
 *     website: 'https://my-project.example',
 *     featured: true,
 *     order: 1,
 *   },
 */
export const projects: Project[] = [];
