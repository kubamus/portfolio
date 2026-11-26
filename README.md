# Kuba Musielski — *Structural Color*

My portfolio website. I am a software developer in Poland building web, mobile, desktop,
and custom software. Color here is a consequence of structure: the site is a continuous
magnification through a butterfly wing — surface, single scale, nanostructure — and then
the wing turns over to show its underside, where my work is kept. See
[`CREATIVE_DIRECTION.md`](CREATIVE_DIRECTION.md) and [`DESIGN_REVIEW.md`](DESIGN_REVIEW.md).

Static site: Vite · TypeScript · Three.js · GSAP + ScrollTrigger · Lenis · Playwright.
No backend.

## Commands

```bash
bun install            # dependencies
bun run dev            # http://localhost:5173
bun run build          # type-check + production build → dist/
bun run preview        # serve dist/ locally
bun run typecheck
bun run test           # Playwright: experience, gallery, fallbacks, production build
bun run shots          # regenerate /screenshots (slow; renders several viewports)
```

Playwright uses the Chromium it installs (`bunx playwright install chromium` once).
The tests start their own servers on ports 5199 (dev) and 5198 (preview).

Development tools in `tests/tools/` render and measure the real scene against a dev server
on port 5180 (`bunx vite --port 5180`): `shoot.mjs` (screenshots at any scroll position),
`brush.mjs` (the brush interaction), `sheet.mjs` (the project sheet), `perf.mjs` (frame
timing per act) and `posters.mjs` (re-renders the no-WebGL fallback frames in
`public/posters/` and `public/og.jpg` — run it after changing the look).

## Adding a project

Everything lives in **one file**: [`src/content/projects.ts`](src/content/projects.ts).
It ships empty on purpose — while it is empty the gallery shows its designed "bare
sockets" state.

1. Put images in `public/projects/<slug>/` (WebP or AVIF, ~1600–2000 px wide is plenty).
2. Add an entry to the `projects` array:

```ts
{
  slug: 'my-project',                       // unique; becomes the link /#work/my-project
  title: 'My Project',
  summary: 'One or two sentences for the gallery label.',
  description: 'Longer text for the detail view.\n\nBlank lines start new paragraphs.',
  cover: { src: '/projects/my-project/cover.webp', alt: 'Dashboard showing …', width: 1600, height: 1000 },
  screenshots: [{ src: '/projects/my-project/settings.webp', alt: 'Settings screen', width: 1600, height: 1000 }],
  technologies: ['TypeScript', 'Next.js', 'PostgreSQL'],
  category: 'Web app',
  year: 2026,
  status: 'live',                           // 'live' | 'in-progress' | 'experiment' | 'archived'
  repository: 'https://github.com/kubamus/my-project',
  website: 'https://my-project.example',
  featured: true,                           // mounted larger, on its own row
  order: 1,                                 // lower first; unordered projects follow, newest first
},
```

Only `slug` and `title` are required. Everything else is optional and the layout adapts:

| Field | Effect when missing |
|---|---|
| `cover` | the project grows a generated structural-color plate with its initial |
| `width` / `height` | the plate's shape is decided once the image loads (portrait covers get an upright scale) |
| `summary`, `technologies`, `category`, `year`, `status` | that line of the label is simply left out |
| `description` | the detail view uses `summary` instead |
| `website`, `repository` | the corresponding link is not shown |

- **Reorder** with `order`. **Hide** without deleting with `hidden: true`.
- The layout is count-agnostic: each project is a scale-shaped mount with a typed slip
  beneath it, in staggered rows — one on its own, two side by side, three per row up to
  six projects, four per row beyond that. `featured` projects open their own row, a size
  larger. From four projects on, a compact index is added at the end for quick scanning.
- Each mount takes the proportions of its cover, so covers between 0.56:1 (tall phone
  screens) and 2.2:1 (ultra-wide) are shown uncropped; the detail view always shows every
  image uncropped. Provide `width`/`height` so the mount can reserve its shape before the
  image loads.

### Contact details

My personal and contact details live in [`src/content/site.ts`](src/content/site.ts) and
are injected into `index.html` at build time.

## Demo fixtures (development only)

To see the gallery populated without inventing work, the dev server can load clearly
labelled demonstration sets from [`src/content/fixtures/`](src/content/fixtures/):

```
http://localhost:5173/?fixtures=none      # empty
http://localhost:5173/?fixtures=one
http://localhost:5173/?fixtures=several   # 5 projects, mixed aspect ratios
http://localhost:5173/?fixtures=many      # 14 projects
http://localhost:5173/?fixtures=edge      # long titles, missing/broken images, minimal data
```

Every fixture is titled "Demo · …", every cover is stamped *DEMO FIXTURE*, and a yellow
badge is shown while they are active. They are excluded from production builds (a
fixtures build is possible with `VITE_FIXTURES=true bun run build`, for review only).

## How it is put together

```
src/
  content/        site.ts, projects.ts, types.ts, fixtures/ (dev only)
  core/           env.ts (capabilities), scroll.ts (Lenis + the single GSAP ticker)
  scene/          state.ts (scene snapshot), keys.ts (camera script), track.ts (scroll → snapshot),
                  text.ts (turning type, the turn's letter flip)
  gl/             stage.ts (renderer, camera, adaptive DPR), wing.ts (≈14k instanced scales,
                  specimen scale, bare sockets), ridges.ts (nanostructure / section), brush.ts
                  (pointer field), post.ts (depth of field, blinds), palettes.ts, shaders/
  ui/             gallery.ts, sheet.ts (project dialog), chrome.ts (nav + scale bar), shape.ts, split.ts
  styles/
```

- **One clock.** GSAP's ticker drives Lenis, which drives ScrollTrigger; the WebGL stage
  renders in the same tick. There is no second animation loop.
- **Scroll → scene.** `scene/keys.ts` anchors camera/palette/lens keyframes to the page's
  acts (`['structure', 0.42]`), re-measured on resize, so every desktop aspect ratio gets
  the same choreography and reversing is exact.
- **All content is HTML.** The canvas is `aria-hidden`; nothing is only in WebGL.

## Accessibility and fallbacks

- `prefers-reduced-motion`: no smooth scrolling, no scrubbed type, no breathing; each act
  holds a still composition and changes by a short crossfade.
- No WebGL2 (or `?nogl`): still frames rendered from the real scene stand in for each
  act (`public/posters/`, downloaded only in this case); everything else works.
- Windows narrower than 960 px or shorter than 540 px: a light, readable single-column
  page; the WebGL module is never downloaded.
- Native `<dialog>` for projects (focus trap, Esc, focus return), skip link, visible focus,
  deep links (`/#work/<slug>`) and the back button close the sheet.
