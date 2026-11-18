# deslop-ui research notes (2026-11)

Ranked by how many independent sources cite each tell. No measured frequency data
exists beyond JCarterJohnson's Reddit study (top two: purple gradients, default fonts).

## Tells (most cited first)

1. Purple/indigo→blue/pink gradients (Tailwind `indigo-500/600` default) — reads as "no brand colour".
2. Inter / shadcn / Tailwind defaults (slate greys, `font-bold`, default line-height).
3. Template landing: centred hero → 3 identical icon-tile feature cards → stats/testimonial → CTA.
4. Card reflex: `rounded-2xl shadow-lg p-6` on everything, card-in-card, one radius + one grey shadow.
5. Gradient-text headline or a single highlighted "accent word".
6. Emoji used as icons.
7. Neon coloured glows, permanent dark mode, low-contrast grey body text.
8. Generic copy ("Supercharge", "Unlock", "Seamless"), em-dash overuse.
9. Fake proof: "10k+ users" stat rows, plastic illustrations.
10. Purposeless motion: fade-slide on every section, hover lift/scale on every card.
11. Pill badge above the H1 ("✨ New").
12. Coloured left/top border stripe on cards and callouts.
13. ALL-CAPS eyebrows, fake 1-2-3 steps, "A · B · C" meta strings, "→" on every link.
14. Grey text on a coloured background.
15. Glassmorphism, bento grids, aurora/blob backgrounds (least cited).

Banning tells alone fails: the model swaps in the next default (cream + terracotta,
near-black + acid green). Enforce with tokens and a scan, not prose alone.

## Practice numbers

- Spacing: 4px base — 4, 8, 12, 16, 24, 32, 48, 64, 96. Label→input 4–8, field→field 16–24, section 48–64+.
- Radius: inner = max(outer − padding, 0); small radius scale tied to spacing.
- Type: 4–6 sizes per screen max; hierarchy by weight/colour first; body 400, headings 500–600; line ≤ 75ch; `tabular-nums`.
- Colour: neutral-first, one accent, 4–6 named hexes; overlays on colour use rgba black/white.
- Elevation: shadows only on floating layers (menu, popover, modal); 2-layer, low opacity; no glows.
- Icons: one set, one stroke, one size per context (16 inline, 20 in buttons); optical ±1px.
- Motion: 150–250ms; exit ≈ 75% of enter; enter `cubic-bezier(0,0,.2,1)`, exit `cubic-bezier(.4,0,1,1)`, in-place `cubic-bezier(.4,0,.2,1)`; start at scale .95 not 0; press `scale(.97)`; transform-origin from trigger; tooltips delay in, instant out; animate only transform/opacity; never `transition: all`; `prefers-reduced-motion`.
- Mobile: targets ≥ 44px; inputs ≥ 16px; hover in `@media (hover:hover)`; never disable zoom; declutter via disclosure, not stacking.

## Sources

- https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
- https://github.com/JCarterJohnson/vibecoded-design-tells
- https://github.com/pbakaus/impeccable
- https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- https://dev.to/alanwest/how-to-fix-the-ai-generated-look-in-your-frontend-1ahh
- https://vercel.com/design/guidelines
- https://github.com/raunofreiberg/interfaces
- https://emilkowal.ski/ui/7-practical-animation-tips
- https://m1.material.io/motion/duration-easing.html
- https://transitions.dev
- https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/

Gaps: transitions.dev gives no numeric durations; Apple HIG and Material 3 motion pages
did not render (numbers above are Material 1); Refactoring UI numbers are secondhand.
