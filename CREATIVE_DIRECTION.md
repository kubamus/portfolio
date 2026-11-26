# Creative direction — *Structural Color*

## Research, briefly

Reference sites were rendered in headless Chromium (1440 × 900, top + three scroll
positions each): bruno-simon.com, meermohsin.me, jesperlandberg.com, yutaabe.com,
aristidebenoist.com, dennissnellenberg.com. Only static frames were inspected; Bruno
Simon's driving world needs a click and real-time control that a screenshot run cannot
experience, and nothing here claims otherwise.

Principles taken (not designs):

- **The technique is the identity** (Bruno Simon, Yuta Abe). The 3D must *be* the idea,
  not decorate it.
- **One committed visual decision beats many effects** (Aristide Benoist's restraint,
  Meer Mohsin's single red).
- **Work presentation can belong to the world** (Jesper Landberg's curved gallery).
- **Almost every reference is near-black or grey.** The space that is genuinely open is
  confident, art-directed color on light and material grounds.

## Three concepts explored

| | Concept | Metaphor | Why it was not chosen / chosen |
|---|---|---|---|
| A | **Chromatophore** | Cuttlefish skin as the first living display: pigment sacs dilate around the cursor; skin layers (pigment, iridophore, leucophore) map to the stack. | Beautiful palette (saffron, umber, crimson), but its strongest image is a 2D cell shader. Reads too easily as a generic Voronoi effect; weak gallery metaphor. |
| B | **Pioneer** | Brutalist concrete slowly colonised by lichen (reaction–diffusion). Scroll is time; color grows over the structure. | Strong natural-vs-built tension, but the first viewport is grey by design, procedural concrete is hard to make premium, and it wraps a developer in an environmental message. |
| C | **Structural Color** ✓ | The blue of a Morpho wing contains no blue pigment. Its color is *built*: ridges and lamellae spaced closer than a wavelength of light. Color as a consequence of construction. | Chosen. It is literally true, it maps exactly onto full-stack work (surface people see / structure that produces it), it demands real 3D, and it yields a gallery metaphor (each project a scale) that grows with the collection. |

(An early fourth idea, a Physarum slime-mould network, was discarded quickly: it is
already strongly associated with existing generative-art work.)

## The decision

**Central idea.** *Color is a consequence of structure.* The site is a continuous
magnification through a wing: from the living surface, into a single scale, into the
nanoscale architecture that makes the color — and then the wing is turned over to show
its underside, where the work is laid out plainly. It maps directly onto full-stack work:
the surface people see, and the structure that produces it.

(This document records the final decisions; how they evolved through rendering and two
rounds of independent critique is in `DESIGN_REVIEW.md`.)

**Emotional arc.** Wonder (an alive surface at golden hour) → curiosity (one scale lifted
to the lens: why is it blue?) → clarity (the structure drawn in section, the "why") → the
loudest moment (thousands of scales rolling over) → calm (a warm, matte place to look at
real work) → an open ending.

**Signature visual.** A field of ~14 000 individually modelled scales — stalked, with
scalloped tips — under a thin-film interference shader, breathing on a swelling
membrane, shot through a macro lens (real depth of field, focus wherever you point).
Never a butterfly silhouette — only the material.

**Signature interaction — *brush the wing*.** Moving the pointer brushes the scales like
velvet. They lift and lean in the brushing direction; because the color is structural,
changing their angle changes their color, and a gold-to-verdigris trail flares and
relaxes. The visitor never paints color; they change structure and color follows.

**Signature transition — *the turn*.** Before the work, a wave crests across the wing and
every scale rolls over on its long axis — lifting into a standing wall with a seam of
light, then settling — turning iridescent spectacle into a matte pigment mosaic: the
underside. A Morpho is electric blue on top and cryptic brown underneath; the work lives
on the honest side. The headline's letters turn over with the scales beneath them, from
roman to gold italic.

**Typography.** *Bodoni Moda* (variable, optical size): a Didone whose hairline/stem
contrast echoes ridges and lamellae. *Instrument Sans* for everything functional. Type
enters by **turning over like a scale**, never by fading up. **Italic is reserved for the
underside** — it appears only after the turn, so the roman→italic flip means something.

**Color philosophy.** Every chapter borrows a real structural or pigment palette and pairs
it with a material ground — never black + accent. Hues are separated by darkness (as
thin-film reflectance dips between interference orders), never by khaki.

| Chapter | Source | Palette |
|---|---|---|
| Surface (hero) | jewel beetle, backlit | copper, verdigris, emerald and gold glints over near-black melanin, under a low apricot sun |
| Magnification | Morpho | ultramarine, cobalt, turquoise, indigo |
| Structure | the architecture itself | warm plaster in mist; in section, only blue survives inside |
| Underside / Work | Morpho underside pigments | umber, sienna, ochre, olive; bone only in hairlines; a blue eyespot |
| Coda | both sides at once | a frozen half-turned wave of structure and pigment under an open sky |

**Materials and light.** Iridescent chitin over melanin (nearly black at the wrong angle —
that contrast is the drama), lit in the hero by a low sun drifting slowly sideways so one
band of scales catches it at a time; plaster for architecture, lit from the viewer's side;
matte pigment for the underside. Atmospheric haze replaces backgrounds.

**3D ↔ content.** The canvas is one fixed stage; all text is real HTML layered over it.
The 3D never carries information that HTML does not also carry.

**Narrative progression.** `Surface` → `A single scale` (one scale lifts out of the wing)
→ `Nanostructure` (a dolly-zoom flattens the ridges into a section drawing; the about-text
sits in the bays, the facts in an architect's title block) → `The turn` → `Underside —
work` → `Both sides`. A microscopy **scale bar** (1 mm → 100 µm → 10 µm → 1 µm → 200 nm →
life size) is the progress indicator. Cuts between worlds close like lamellae: staggered
vertical blinds, the same stripes as the ridges they reveal.

**Gallery.** A specimen collection on the underside. Each project is a scale-shaped paper
mount that hugs its (uncropped) cover, scallops up and stalk down, pinned above a small
typed slip with its name, year, status and stack. Rows are staggered like scales;
the layout is count-agnostic (1 to many, with an index from four projects up).
Empty state: **bare sockets** rendered in the wing itself — scale-shaped clearings of clear
membrane dotted with the sockets scales will grow from — plus a plain line pointing to
GitHub. Detail view: the cover lifts out of its mount into a full sheet.

**Rhythm.** Warm and alive (surface) → quiet and close (one scale) → pale, then precise
(structure) → the loudest moment (the turn) → calm and readable (work) → open (coda).
