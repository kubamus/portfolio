# Design review — revisions and limitations

How the experience was evaluated and changed, in the order it happened. Every cycle
rendered the real site in Chromium (GPU: AMD Radeon RX 7600 via ANGLE/D3D11) and the
screenshots were inspected before changing anything.

## Self-critique cycles

| # | What the renders showed | What changed |
|---|---|---|
| 1 | The hero was a muddy brown field. Scale geometry was **inverted**: every view was showing the matte *undersides*. Structural colour far too dim; palette drifted across long scroll spans (Structure turned lavender); Structure copy overlapped. | Fixed face orientation and tilt direction; brighter thin-film ramp; explicit hold keys in the camera script; Structure reflowed. |
| 2 | Far field read as noisy "lace"; no sense of scale or lens. | Added a **depth-of-field pass** (thin-lens CoC, Vogel-disk gather, focus = wherever the camera looks). The hero became macro photography. |
| 3 | Hero monotone orange (warm scales under a warm sky); Morpho looked like corrugated plastic; underside read as animal print. | Physically-motivated hue mapping (head-on copper → grazing teal), finer striation, calmer underside pattern. |
| 4 | A wall of half-turned scales in the hero foreground. | Root cause: the turn-over wave was mapped to a view-relative range, so at `flip = 0` off-screen scales were mid-flip. Rewrote it as an explicit wavefront guaranteed off-field at 0 and 1. Added untinted Fresnel sheen. |
| 5 | Hero still flat; brown gaps everywhere. | Drifting colour fields across the wing; mid-frequency swell; (shed-scale "flakes" were tried here and later removed). Gallery: shorter, rounder scale silhouette; frosted glasswing sockets. |
| 6 | **Brushing was invisible.** Measured in-browser: the brush field worked, but its radius was a third of a scale wide. Once widened it painted a *dark* trail. | Second root cause: scale tips pointed *toward* the camera, so lifting a scale turned its iridescent face away. Reversed growth direction — brushing now visibly paints colour. Added a structural "flare" to brushed scales. |

## Independent critique — round 1

A separate agent with no implementation context reviewed the brief, the creative
direction and 30 screenshots (all viewports, brush sequence, demo-fixture gallery).
Its six main findings, and what was done:

1. **The wing read as a pastel sunny meadow; no darks, no focal plane.** → Re-lit: narrow
   specular glints, a thin-film reflectance peak, near-black melanin, and a colour ramp
   whose intensity *dips between stops* (as real thin-film reflectance does between
   interference orders) so hues are separated by darkness instead of khaki. Fog reduced,
   flakes removed, lens focus follows the pointer.
2. **The gallery was the weakest part** (rainbow rims, cropped screenshots, card labels,
   frosted "luggage-tag" sockets, apologetic copy, CTA below the fold). → Projects are now
   scale-shaped paper mounts (stalk at the bottom) carrying **uncropped** rectangular
   screenshots and typed labels; one hairline rim that shifts emerald→gold with the
   pointer; the empty state's bare sockets are now **rendered in the 3D wing** (scale-shaped
   clearings of clear membrane dotted with sockets) and the page says plainly where the
   work is, with the GitHub link in the first viewport.
3. **Structure used generic imagery** (tunnel, holographic slats). → A dolly-zoom now
   flattens the ridges into a near-orthographic **section drawing** of the Morpho ridge
   ("Christmas tree" lamellae). The camera fits exactly three bays (four on ultrawide) so
   the text columns align to the rendered ridges; drawing annotations and an architect's
   title block carry the facts.
4. **The turn read as a flat 2D wipe; edge-on letters looked like glitches.** → Lower,
   banking camera; bent wavefront; letters fade to nothing at edge-on; muted underside with
   one large eyespot as the post-turn anchor.
5. **Same layout in every chapter; italic everywhere.** → Italic is now reserved for after
   the turn (so the roman→italic flip means something). Magnify became a centred caption,
   the turn a single full-width line the wave crosses letter by letter, the coda a giant
   address. Copy moved to first person where it is factual.
6. **Muddy in-between frames; the "single scale" never appeared.** → One scale now lifts
   out of the wing in the magnification chapter and is the camera's subject before the dive.

**Declined:** listing my public GitHub repositories as an index automatically, since I want
to curate which projects appear here.

## Independent critique — round 2

A second, fresh agent reviewed 40 new screenshots against the brief and the round-1
findings. Its verdict: Structure and the lifted specimen scale now hold up ("the most
original frame on the site"), the roman→gold-italic turn lands, brushing really changes
structural colour — but the second half didn't yet: the underside read as a blurred
"pixel rug" behind everything after the turn, mounts were "cards in costume", chapter
changes were dissolves, the hero still lacked a light-over-melanin moment, and no still
showed the turn as a *roll*. Changes made:

| Finding | Change |
|---|---|
| Underside = blurred pixel rug (the backdrop for turn, work, gallery, coda) | Features scaled up ~2× (an eyespot spans ~20 scales), pattern sampled slightly inside each scale so ring edges soften, bone kept to hairlines; behind the work the wing is now sharp and dimmed (blur 8 px → 2 px). |
| Gallery mounts = cards in costume | Each mount now hugs its cover (no blank paper, nothing cropped); rounded scalloped tip instead of a zigzag; label moved to a small typed slip pinned under the stalk; plates ~22 vw in staggered rows of 2–4; rim only on hover. |
| Bare sockets looked like "cream crackers"; empty-state copy on a pale patch | Clearings are now dark, glassy membrane with socket rings catching light; bone text reads over them. Repeated sentence removed. |
| Transitions were dissolves | Cuts now close as **staggered vertical blinds** in the post pass (crisp, two colours per frame) — the same stripes as the ridges they reveal. The structure dolly starts on lit plaster in mist; blue depth arrives only as the section flattens. |
| Hero: no glints over melanin | Peak and floor terms cut; a **low sun behind the field drifts slowly sideways**, so one band of scales catches the light at a time; deeper haze. "Musielski" uses a lower optical size so its hairlines survive over the field. |
| Turn didn't read as a roll; letters left holes | Wave lift raised and front narrowed into a standing wall of scales with a seam of light at the edge-on moment; letters now flatten (never below 14 %) and reopen as their italic face — no holes. |
| Gallery entrance tipped plates into the lens | Entrance is now a small hinge from the top (+12°). |
| Bugs: nav collisions, faint scale bar, ghost hint, sheet morph squashing the cover, ultrawide headline orphan, a stray blue band during the dolly | Stronger scrims; hint fades faster; the sheet opens with one uniform scale from the cover itself; headline sized for 4.2 vh; the blue band was a real bug (the far wall's marker value fed a negative iridescence weight, and `elevation` was interpolating from the cut) — both fixed. |

Not adopted: overlapping neighbouring mounts with z-order (kept separate for legibility of
the slips), and placing paragraphs *inside* the bays of the section (the text is aligned
to the bays but set above the drawing, where it stays readable at every aspect ratio).

## Final originality review

| Reference | What it does | Where this differs |
|---|---|---|
| Bruno Simon | A playable toy world; the game is the portfolio. | No game mechanics. One material studied at five magnifications; the interaction (brushing) is the physics of structural colour, not play. |
| Meer Mohsin | Cinematic red/black, distressed type, a stylised chrome *wing emblem*. | The only shared word is "wing". Here there is never a butterfly silhouette — only the material at macro and nano scale — on light, warm grounds, with a Didone and no distressing. |
| Jesper Landberg | Project screens on a curved WebGL strip in a dark void. | Projects are paper specimen mounts in HTML on the underside of a living wing; no curved screen wall, no void. |
| Yuta Abe | One object whose *rendering mode* changes on scroll (halftone → wireframe). | Closest in spirit (the render "turns"), but here the change is physical — scales roll over, structure becomes pigment — and it is a sequence of different worlds, not one object. |
| Aristide Benoist | Restraint, compressed sans, a tick-mark progress bar. | Progress is a microscopy scale bar that reports magnification (1 mm → 200 nm → life size); typography is a Didone at monumental size. |
| Dennis Snellenberg | Name marquee over a portrait, grey ground, pill UI. | No portrait, no marquee, no pills; the name is set in two corners of a full-viewport 3D field. |

Central concept, hero composition, signature 3D (instanced thin-film scales + section
drawing), scroll narrative (magnification), colour philosophy (structural vs pigment),
gallery (specimen mounts, bare sockets) and signature interaction (brushing changes
structure, not paint) are each specific to this concept and to the "surface / structure"
reading of full-stack work. Nothing here was found to be fundamentally similar to the
references.

## Verification

- **Build:** `bun run build` (type-check + Vite) succeeds. Entry JS 165 kB (61 kB gzip),
  CSS 32 kB (8 kB gzip); the WebGL stage (36 kB) and Three.js (533 kB, 132 kB gzip) are a
  separate chunk loaded only on capable desktop windows. Demo fixtures are not in the
  production bundle (asserted by a test).
- **Tests:** `bun run test` — 22 Playwright tests, all passing on the final state:
  identity/links/no console errors; the full scroll journey and rapid reversal; real wheel
  input through Lenis; nav, skip link, URL anchors on arrival; resizing across four desktop
  sizes without horizontal overflow; pointer brushing (brush-field energy); empty gallery
  (copy + 3D sockets); fixtures with 0 / 1 / 5 / 14 projects and edge cases (long titles,
  missing and broken images, minimal data); dialog by mouse and keyboard, Esc, focus
  return, prev/next, deep links, browser Back; reduced motion; no-WebGL; narrow window;
  production build (fixtures ignored, no dev hooks, all assets resolve).
- **Screenshots:** `/screenshots` — the journey at 1920×1080 and key moments at 2560×1440,
  1440×900, 1280×720 and 3440×1440; demo-fixture gallery, index and project sheet; the brush.
- **Performance (measured, not estimated):** frame intervals over 240 frames per act in
  Chromium on an AMD Radeon RX 7600 (ANGLE/D3D11): median 16.7 ms, p95 ≤ 16.8 ms (the
  60 Hz vsync interval) at every act, at 1920×1080 (pixel ratio 1), 2560×1440 at pixel
  ratio 1.75, and 3440×1440. Script: `tests/tools/perf.mjs`.

## Known limitations

- **Browsers:** tested in Chromium only (Playwright). Firefox and Safari were not run.
  WebGL2 is required for the scene; without it the painted fallback is used.
- **Hardware:** performance was measured on one mid-range desktop GPU. Integrated laptop
  GPUs were not tested; the stage lowers its pixel ratio automatically when frames run
  long (down to 0.75), but 14 000 instanced scales with MSAA and depth of field may still
  be heavy there.
- **Motion was judged from stills and frame timings.** Screenshots jump to scroll positions;
  the critics saw stills, not the live scroll. Easing and pacing were tuned by reasoning
  about the timeline, not by watching recordings.
- **Reference research** inspected static frames of the reference sites (top + three
  scroll positions); their interactions (e.g. Bruno Simon's driving) were not experienced.
- **Small known imprecisions:** the turn's letter sync and the brush ray-cast use the flat
  plane y = 0 rather than the swelling surface; the empty gallery's 3D clearings are placed
  in world space and only approximately frame the HTML text beside them.
- **Projects are intentionally empty for now:** I am curating which projects to feature in
  `src/content/projects.ts`.
- **Mobile is out of scope;** narrow windows get a minimal readable page.
