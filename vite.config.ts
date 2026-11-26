import { defineConfig, type Plugin } from 'vite';
import { site } from './src/content/site.ts';

/** Replaces {{token}} placeholders in index.html with values from src/content/site.ts. */
function siteTokens(): Plugin {
  const [emailUser = '', emailDomain = ''] = site.contact.email.split('@');
  const tokens: Record<string, string> = {
    name: site.name,
    givenName: site.givenName,
    familyName: site.familyName,
    role: site.role,
    location: site.location,
    availability: site.availability,
    githubUrl: site.github.url,
    githubHandle: site.github.handle,
    linkedinUrl: site.linkedin.url,
    linkedinHandle: site.linkedin.handle,
    email: site.contact.email,
    emailUser,
    emailDomain,
    description: site.description,
    year: String(new Date().getFullYear()),
  };
  return {
    name: 'site-tokens',
    transformIndexHtml(html) {
      return html.replace(/\{\{(\w+)\}\}/g, (m, key: string) => tokens[key] ?? m);
    },
  };
}

export default defineConfig({
  plugins: [siteTokens()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  server: { port: 5173 },
});
