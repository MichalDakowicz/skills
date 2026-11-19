---
name: deslop-ui
description: Build or fix user interfaces so they look designed and confident, not AI-generated, without stripping their character. Plan first (what the screen is for, prior art, signature moves, palette, type), keep or add bold type, a confident accent and a real wordmark, fix the actual slop (card overuse, default purple gradients, inconsistent spacing/radius/icons, emoji icons, pulsing dots, glow shadows, eyebrow labels, filler copy, cluttered mobile), then check with a scan script and a side-by-side before/after screenshot that must look better, not just plainer. Use whenever writing or restyling any frontend (page, component, dashboard, landing page, app screen, mobile layout), and when the user says "deslop", "make it not look AI-made", "clean up this UI", "it looks generic" or asks for a UI review.
---

# Deslop UI

AI-built UIs fail in two opposite ways. **Slop**: Tailwind indigo, purple gradients,
everything in a shadowed card, emoji icons, a pulsing dot, filler copy. **Blandness**:
the over-correction, where every colour, weight and flourish is removed until the page
is grey, thin and forgettable. Both are wrong. The goal is a UI that looks
*intentional*: confident type, a colour that is used with conviction, a clear focal
point, a clean structure underneath.

**Fix slop by replacing generic choices with specific ones, never by subtracting
character.** Lowering weights, desaturating, removing colour from text, shrinking
things or deleting the logo treatment are not fixes. If a change makes the screen
quieter but not better, revert it.

If the project already has a design system, tokens or a style guide, it wins over
every number here. Apply these rules only where it is silent.

## Under the orchestrator

When the `orchestrator` skill is running, or you are one of its builders, its rules
win where they clash with this skill; do not stop or ask the user for a plan.
- The design source and spec are the truth. Do not invent copy, sections, colours or
  states to "lift" or add signature moves. Intensity and Signature moves apply only
  to what the design already shows; where it is silent, ask via QUESTIONS.
- The plan (section 1) is the orchestrator's: it is written once into `goal.md`'s
  Looks bar or `project.md`. A builder gets the Keep and Broken lists in its prompt
  and works only those items, inside its allowed paths.
- Builders run the scan (section 3, step 1) as one of their check commands; the
  orchestrator reruns it and reads the diff. Screenshots and the before/after are
  the tester's job, against the Looks bar. Builders never commit.

## 0. Fixing an existing UI (most important mode)

1. Screenshot it first (desktop + 375px). Write two lists:
   - **Keep**: what gives it character — wordmark, heavy headline weight, accent
     colour in text or buttons, a product visual, a bold number, a layout idea.
     These stay, untouched unless broken.
   - **Broken**: concrete problems only, each one checkable: card-in-card, a
     section boxed for no reason, off-scale spacing, mismatched radii or icon
     sizes, grey text on colour, a tell from the ban list, clutter on mobile.
     Run the scan before you start: every hit goes on this list, including in
     code you were not otherwise touching, and the scan must end clean or with a
     reason per remaining hit. New sections you add (lists, FAQ) reuse the
     existing type scale; adding sizes is not allowed.
2. Fix the Broken list. Smallest change per item. Do not restyle what works,
   do not change the palette or fonts unless they are on the Broken list.
3. **Lift 1–2 things.** Removing slop alone leaves the page as generic as before.
   Pick the one or two Keep items that carry the brand and push them a step
   (see "Intensity" below): a bolder or larger headline, the accent on the key
   number, a wordmark detail, a more real product visual, a less template-like
   hero composition. A step, not a redesign.
4. Screenshot again and put before/after side by side. For every change ask
   "is this better, or just plainer / just louder?" Revert either.

## 1. Building new: plan first (10 lines max, before markup)

1. **Purpose.** "What's the one thing this screen is for?" One sentence. That is
   the focal point; it gets the most size, weight and colour.
2. **Prior art.** 1–3 established products that solve the same screen (issue list →
   Linear, invoices → Stripe, habits → Streaks). Use their conventions for layout
   and placement of actions; do not invent layout for a solved problem.
3. **Signature moves (required, pick 2).** What will make this memorable, dosed
   per the Intensity table below:
   - a heavy display headline (700–800, tight tracking, clear size jump from body),
   - an accent colour used with conviction: a key phrase of the headline in solid
     accent, filled primary buttons, accent on the key number,
   - a real wordmark: the name set bold with one distinctive detail (accent
     full stop, a simple glyph, a custom letter-spacing) — not a generic icon
     plus thin text,
   - the actual product as the hero visual, with believable content,
   - one strong layout idea (asymmetric hero, an oversized key number, a single
     tinted section).
4. **Palette.** Neutral surfaces + one confident accent (+ a danger colour if
   needed). Neutral-first applies to surfaces and chrome, not to the brand: the
   accent should be visible in several places on every screen. Write the hexes.
5. **Type.** Font chosen on purpose (system stack is fine if weights are used
   boldly). A scale of 5–6 sizes for the page, no in-between values.
6. **Wireframe.** ASCII sketch, desktop and mobile, showing what mobile collapses.

## Intensity: confident, not loud

Too plain and too loud both fail. Aim for the middle:

| | Too plain | Target | Too loud |
|---|---|---|---|
| Landing headline | ≤ 2× body, 500–600 | 48–72px desktop, 700–800, ~3–4× body | 96px+, 5× body, every heading huge |
| App title | body-size, regular | 24–32px, 700–800 | display-size hero in an app |
| Accent use | nowhere / one button | 3–5 places: primary action, focal phrase or number, wordmark detail, active state | every heading, number, icon and band |
| Colour blocks | none | at most one tinted or accent-tinted section per page, if it carries a message | full-bleed saturated bands, several |
| Accent hue | grey | a clear but not neon hue (mid lightness, moderate chroma) | neon or fully saturated on large areas |
| Signature moves | 0 | 2 | 3+ at full strength |

Large saturated areas (bands, big filled panels) count double. In apps, keep the
accent on interactive and data elements; the chrome stays calm.

## 2. Build rules

### Structure (the main fix)
- **Cards are the #1 slop.** Use rows, lists, dividers and whitespace to group;
  a card only for something genuinely raised (a floating panel, a draggable item,
  a product mock, one featured object). Never card-in-card. Never a card per list
  item when rows would do. A section does not need a box.
- One focal point and one primary action per view; everything else is quieter.

### Lists that replace cards
Taking the box away also takes away the weight the card gave. A bare "bold label,
grey sentence" row repeated N times is the bland version of the card grid, not the
fix. Each row has to earn the weight back through content and type:
- **An anchor per item**, on the left or top: a large accent numeral (32–48px, 800)
  for sequences, a consistent icon (20–24px, optionally in a tinted square), a key
  value (price, time, count) in heavy type, or a small thumbnail.
- **Show, don't describe.** Where a feature can be shown, put a fragment of the
  product in the row: a chip, a mini UI row, a sample value ("12.5 h × $85 →
  $1,062.50"), a status badge, a two-line code/data sample. One real fragment
  beats three sentences.
- **Real type contrast inside the row:** title 18–20px at 600–700, body at reading
  size in muted colour, 4–8px between them, 24–32px between rows. Never title and
  body at the same 14–15px.
- **Uneven rhythm by importance:** the lead item bigger (wider, with a visual),
  the rest compact. N identical rows read as a spreadsheet.
- **Pick the layout by content:**
  - sequence / how it works → numbered timeline: big accent numerals, a thin
    connecting line, each step with its artefact (the screen, the output);
  - 3–6 features → split section: heading + one-line intro on the left (sticky on
    desktop), anchored rows on the right; or alternating text + UI-fragment rows
    for the top 2–3 and a compact list for the rest;
  - specs / plan comparison → a real table with aligned columns, tabular-nums;
  - checklists → accent check icon, two columns when longer than ~6, grouped by
    theme with a small subheading.
- Dividers inset to where the text starts when rows have an anchor; hover
  highlight only when the row is clickable.

### Menus and row actions
- **A button that reveals choices opens a popover, never inline content.** "⋯",
  "More", a user avatar, a sort/filter button, a split-button arrow: the menu
  floats above the page anchored to its trigger, it does not expand a row or push
  the list down. (Inline expansion is for disclosures whose content belongs to
  the page: an FAQ answer, a details row.)
- Build: the `popover` attribute (or an absolutely positioned layer) placed
  under/beside the trigger, aligned to the trigger's edge nearest the page
  centre (a "⋯" at the right edge opens leftward), flipped up when there is no
  room below; 4–8px gap from the trigger; min-width ~160px; 4px inner padding;
  items 36–40px tall (44px on touch) with 8–12px horizontal padding and an
  optional 16px leading icon; radius 8–12px with items concentric inside it;
  a 1px border plus the soft two-layer shadow (menus are a floating layer).
- Behaviour: opens on click (not hover), closes on outside click, Escape, item
  choice and scroll; focus moves to the first item and returns to the trigger;
  arrow keys move between items; `aria-haspopup="menu"` + `aria-expanded` on
  the trigger, `role="menu"` / `menuitem` inside. Animate from the trigger
  (`transform-origin` at the trigger corner, scale .95 + opacity → 1, 150ms in,
  100ms out).
- Content: verbs ("Rename", "Delete"), most-used first, destructive last, in the
  danger colour, after a divider. Delete either confirms inside a small dialog or
  (better for cheap actions) happens at once with an "Undo" toast for ~5s.
  Rename edits the text in place where it already is (the name becomes an input,
  Enter saves, Escape cancels), without moving any other row element.
- **Row action placement:** the primary per-row action (checkbox, play, toggle)
  at the leading edge, like Things, Todoist, Linear; trailing edge holds the
  secondary icon buttons with "⋯" always last at the far right. All row icon
  buttons share one box size (32–40px desktop, 44px touch) and line up in the
  same column on every row, vertically centred on the row's title line. Never
  stack action buttons vertically in a row; never mix a filled button and a
  bordered button for siblings. Secondary icon buttons are ghost (no border,
  hover fill); on desktop they may appear on row hover, on touch always visible.
- **Mobile navigation:** nav links don't vanish at small widths; they collapse
  into a menu button that opens a sheet or popover (same behaviour rules),
  while the primary CTA stays visible in the bar.

### FAQ
The browser-default `<details>` (tiny triangle, small text, one flat column) is
the slop version. Do:
- **Layout:** on desktop two columns — left: the heading, one line of intro and a
  real way to ask (a named person or email, "answered within a day"), sticky;
  right: the questions. Mobile: one column, the ask-us line at the end.
- **Questions are big targets:** 18–20px at 600, whole row clickable, 20–24px
  vertical padding, hairline dividers, `summary { list-style: none }` with a
  custom 20px marker on the right (a + that rotates 45° to ×, or a chevron) in
  muted colour, accent on hover/open. The open question goes full contrast.
- **Answers are worth opening:** reading-size muted text, max 65ch, concrete
  (numbers, a short example, a link, a tiny UI fragment if it explains better).
  Write the real objections — price, cancelling, data export, payments, security —
  4–8 of them; group by topic with small subheadings past 6. Open the most-asked
  one by default.
- **Motion:** the answer expands with `grid-template-rows: 0fr → 1fr` (or
  `interpolate-size: allow-keywords`) at 200ms ease-out, collapses at 150ms; the
  marker rotates in sync; reduced-motion → instant.
- No template landing (centred hero → 3 identical icon-tile cards → stats → CTA).
  Lead with the most specific thing; give the main feature the most room.
- Progressive disclosure: frequent actions visible, rare ones (rename, delete,
  settings) behind "…" or a detail view. Drop redundant labels ("Name:", a
  "Status" heading over a status badge).
- Affordance: clickable things look clickable, static things don't.
- No coloured left-border stripes on callouts, no glassmorphism, aurora blobs or
  bento grids unless the project asks for them.

### Typography (bold hierarchy)
- Hierarchy needs real contrast. Display/headlines 700–800, body 400, labels 500–600.
  On landing pages the headline is ~3–4× the body size (see Intensity). Timid
  hierarchy (everything 500–600, sizes close together) is a failure, not restraint;
  so is shouting every heading.
- Headline: tight leading (1.0–1.15), tracking −0.02 to −0.03em at large sizes,
  `text-wrap: balance`, no widows. Hyphenated compounds in headings use a
  non-breaking hyphen (U+2011) so "one-person" never splits at the line end;
  check headings at a mid width (~900px), not only desktop and phone. Body: leading 1.5, `text-wrap: pretty`,
  45–75ch line length.
- Colour in text is good when it means something: a headline phrase in the solid
  accent, the total in accent, a coloured status word. Gradient text is not.
- Use the scale; do not invent sizes. Keep kerning on; never letter-space body
  text; loosen only tiny uppercase. Match x-heights when pairing fonts.
- `tabular-nums` for numbers that change or line up. Monospace only for code/IDs.
- Sentence case. No ALL-CAPS eyebrow labels above every heading, no "A · B · C"
  meta strings, no "→" appended to every link.

### Colour
- Surfaces and chrome neutral; the accent used confidently for the primary action,
  the focal element and key data. More colour if the project aims for it.
- Ban the default AI palette: indigo/violet/purple 500–600 and purple→blue/pink
  gradients, unless they are the brand.
- Gradients only when they carry meaning or are part of the brand. Never gradient
  text.
- Overlays and text on a coloured surface: white/black at partial opacity or a
  darker same-hue tint, never a fixed neutral grey or a solid dark box (a key hint
  "N" on a lime button is `rgba(0,0,0,.12)` + `color: inherit`).
- Text contrast passes WCAG AA. Define colours in `oklch()` where possible; derive
  hover/active by changing lightness only.

### Spacing and shape
- 4px scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Proximity shows grouping:
  label→input 4–8, field→field 16–24, section→section 48–96.
- Radius from a small scale; nested radius concentric (inner = outer − padding).

### Elevation
- Shadows only on floating layers (menus, popovers, dialogs, toasts, dragged
  items, a featured product mock). Subtle, two layers, low opacity. No coloured
  glows.

### Icons and marks
- One icon set, one stroke width, one size per context; no emoji as UI icons.
  Centre in a fixed square box; align by eye (nudge optical outliers ±1px).
- Data marks people read (calendar cells, streak squares, chart dots) are big
  enough to read at a glance (≥ 16px, labelled). Compact is not tiny.

### Motion
Motion is designed, not sprinkled: only on action or state change.
- No pulsing/pinging activity dots; no hover lift on every card; no fade-in on
  every section.
- 150–250ms; exit faster than enter (~75%). Enter `cubic-bezier(0,0,.2,1)`, exit
  `cubic-bezier(.4,0,1,1)`, in-place `cubic-bezier(.4,0,.2,1)`, as tokens.
- Origin-aware: popovers scale from their trigger (start `scale(.95)`, never 0),
  toasts and sheets slide from their edge. Press feedback `scale(.97)`.
- Animate useful feedback: a check that fills, a total that ticks, an item that
  slides in where it landed. Stagger lists 30–50ms, total < 300ms. Shared element
  transitions (View Transitions / FLIP) when one element becomes another.
- Only `transform` and `opacity` (one exception: accordion/disclosure height via
  `grid-template-rows` or `interpolate-size`); never `transition: all`; interruptible (CSS
  transitions); `prefers-reduced-motion` respected. Patterns: https://transitions.dev

### States
- Loading (content-shaped skeleton or delayed spinner), empty and error states.
- No layout shift: reserve space, never change weight/border on hover.
- Optimistic updates for cheap actions (toggle, rename, reorder), with rollback.

### Mobile
- Declutter, don't just stack: keep the focal point and primary action, collapse
  secondary actions into "…" or a sheet, shorten labels, hide metadata behind
  disclosure. Keep the character (headline weight, accent, wordmark) at full
  strength; scale sizes down, not boldness.
- No sideways scroll at 375px: grid text tracks are `minmax(0,1fr)` (plain `1fr`
  won't shrink below a long word), long strings (emails, URLs, IDs) get
  `overflow-wrap: anywhere`, flex rows that can overflow get `flex-wrap: wrap`.
  Check `document.documentElement.scrollWidth === clientWidth`.
- Tap targets ≥ 44px, inputs ≥ 16px, hover-only affordances under
  `@media (hover:hover)`, never disable zoom, `env(safe-area-inset-*)` on fixed bars.

### Copy
- Specific over slogan: what it does, for whom, with a real number if one exists.
  No "Supercharge / Seamless / Unlock / Empower / AI-powered". No invented stats,
  logos or testimonials; no "✨ New" pill over the headline.

## 3. Check (always)

1. `python <skill-dir>/scripts/scan.py <files>` — fix each hit or keep it with a
   one-line reason.
2. Screenshot desktop and 375px. Answer honestly:
   - Focal point obvious in one glance?
   - **Intensity check:** place it on the Intensity table. Looks like a wireframe →
     push the 2 signature moves. Shouting (huge type everywhere, accent on
     everything, saturated bands) → pull back to the target column.
   - **Slop check:** any card that isn't raised, card-in-card, default purple,
     emoji icon, glow, pulse, eyebrow, filler copy?
   - Mobile shorter and calmer than desktop, still recognisably the same brand?
3. When fixing an existing UI, compare before/after side by side and revert any
   change that is plainer but not better. Report what you kept, what you fixed.

## References

- `references/research.md` — ranked AI tells, practice numbers and sources.
