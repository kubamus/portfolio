/**
 * My personal details used across the site (including index.html, via the small
 * `siteTokens` plugin in vite.config.ts).
 */
export const site = {
  name: 'Kuba Musielski',
  givenName: 'Kuba',
  familyName: 'Musielski',
  role: 'Software developer',
  location: 'Poland',
  availability: 'Remote, part-time, and freelance gigs',
  github: {
    handle: 'kubamus',
    url: 'https://github.com/kubamus',
  },
  linkedin: {
    handle: 'kuba-musielski',
    url: 'https://www.linkedin.com/in/kuba-musielski/',
  },
  contact: {
    email: 'musielskikuba@gmail.com',
    /** Optional link to a PDF resume or CV. Shown in contact sections when set. */
    resumeUrl: '' as string,
  },
  /** Production origin, used for canonical/OG URLs once the site is deployed. */
  origin: '' as string,
  description:
    'My portfolio website. I am Kuba Musielski, a software developer in Poland building web, mobile, desktop, and custom software with AI agents, available for remote part-time roles and freelance gigs.',
} as const;

export type Site = typeof site;
