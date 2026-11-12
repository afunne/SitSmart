# SitSmart – Style Guide

Dark purple base with light ruby accents. The app uses a dark theme; Lavender Mist is used only
for light surfaces such as the ticket view and print.

## Palette

| Token | Name | Hex | Use |
|---|---|---|---|
| `--ink` | Ink Purple | `#1C0F26` | Page background (dark theme), text on light backgrounds and on ruby buttons |
| `--plum` | Deep Plum | `#2A1638` | Cards / surfaces |
| `--royal` | Royal Purple | `#4B2465` | Header, decorative borders, secondary buttons |
| `--ruby` | Light Ruby | `#E0457B` | Primary buttons, links (on Ink Purple only), selected seat |
| `--rose` | Rose Ruby | `#F27A9F` | Hover / focus, links on cards |
| `--mist` | Lavender Mist | `#F7F2FA` | Light background (ticket, print) |
| `--off-white` | Off White | `#FBF7FC` | Text on dark backgrounds |

### Seat states

| State | Hex | Seat number text | Extra marker |
|---|---|---|---|
| Free | `#4CC38A` | Ink Purple | – |
| Reserved (held by someone else) | `#8E7AA8` | Ink Purple | – |
| Sold | `#6E2340` | Off White | **X icon** (Off White), required |
| Selected (by me) | `#E0457B` (Light Ruby) | Ink Purple | – |

### Status colors

| Status | Hex | Use |
|---|---|---|
| Success | `#4CC38A` | Same green as a free seat: "available / OK" |
| Warning | `#F5B947` | E.g. reservation about to expire |
| Error | `#FF6464` | Coral red, kept clearly apart from the ruby/rose accents |
| Info | `#7DB4F5` | Neutral notices |

Use status colors as text/icons on Ink Purple or Deep Plum, or as a fill with **Ink Purple** text.
Don't use them as text on light backgrounds (e.g. Success on Lavender Mist is 2.01:1); on the
ticket/print view use Ink Purple text with a colored icon or left border instead.

## CSS variables

```css
:root {
  --ink: #1C0F26;
  --plum: #2A1638;
  --royal: #4B2465;
  --ruby: #E0457B;
  --rose: #F27A9F;
  --mist: #F7F2FA;
  --off-white: #FBF7FC;

  --seat-free: #4CC38A;
  --seat-reserved: #8E7AA8;
  --seat-sold: #6E2340;
  --seat-selected: var(--ruby);

  --success: #4CC38A;
  --warning: #F5B947;
  --error: #FF6464;
  --info: #7DB4F5;

  --border-strong: #8E7AA8; /* input borders and other boundaries that must be visible */
}
```

## Rules

1. **Text on Light Ruby buttons is Ink Purple.** White fails AA (3.96:1); Ink Purple passes (4.63:1).
   Hover state: Rose Ruby background, still Ink Purple text (7.03:1).
2. **Links:** Light Ruby only on the Ink Purple page background (4.63:1). On Deep Plum cards use
   Rose Ruby (6.34:1) – Light Ruby there is only 4.18:1. On light backgrounds (ticket, print) use
   Royal Purple (10.94:1).
3. **Secondary buttons:** Royal Purple background, Off White text (11.39:1).
4. **Focus:** 2px Rose Ruby outline with 2px offset (7.03:1 on Ink Purple, 6.34:1 on Deep Plum).
   On light backgrounds use a Royal Purple outline.
5. **Borders:** Royal Purple borders are decorative only (1.37–1.52:1 against the dark
   backgrounds). Input fields and any boundary the user must see use `--border-strong`
   `#8E7AA8` (4.80:1 on Ink Purple, 4.33:1 on Deep Plum).
6. **Seats never rely on color alone.** Sold seats always show the X icon; the seat-map legend
   shows each state with its color *and* name. Sold seat color vs. background is only
   1.56–1.73:1, so the X (10.02:1) is what makes it identifiable.

## Typography

| Role | Font | Weight |
|---|---|---|
| Headings (h1–h4) | [Poppins](https://fonts.google.com/specimen/Poppins) | 600 |
| Body, labels, inputs | [Inter](https://fonts.google.com/specimen/Inter) | 400 (regular), 500 (emphasis, buttons) |

Both fonts come from Google Fonts and include the Latin Extended characters needed for
Estonian (õ, ä, ö, ü, š, ž). Google Fonts loads the `latin-ext` subset automatically
when those characters appear on the page.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600&display=swap" rel="stylesheet">
```

### Type scale

Sizes are in `rem`; px values assume the default 16px root size.

| Element | Size | ≈ px | Font / weight | Line height |
|---|---|---|---|---|
| h1 | 2.25rem | 36px | Poppins 600 | 1.2 |
| h2 | 1.75rem | 28px | Poppins 600 | 1.2 |
| h3 | 1.375rem | 22px | Poppins 600 | 1.2 |
| h4 | 1.125rem | 18px | Poppins 600 | 1.2 |
| Body | 1rem | 16px | Inter 400 | 1.6 |
| Small | 0.875rem | 14px | Inter 400 | 1.6 |
| Button | 0.95rem | ≈15px | Inter 500 | 1.2 |

### Numbers

Prices, seat numbers, row numbers, counters and times use
`font-variant-numeric: tabular-nums` so digits have equal width and columns and
seat labels line up (e.g. `9` and `12` take the same space per digit).

### CSS

```css
:root {
  --font-heading: "Poppins", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}

body {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.6;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.2;
}

h1 { font-size: 2.25rem; }
h2 { font-size: 1.75rem; }
h3 { font-size: 1.375rem; }
h4 { font-size: 1.125rem; }

small, .text-small { font-size: 0.875rem; }

button, .btn {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.95rem;
  line-height: 1.2;
}

strong { font-weight: 500; }

.price, .seat, .seat-label, .tabular {
  font-variant-numeric: tabular-nums;
}
```

### Typography and contrast

Body text, small text and button labels are "normal text" in WCAG terms, so they need
the 4.5:1 pairs from the contrast tables below. Only h1 and h2 (≥ 24px) count as large
text. Even so, don't use a pair that only passes for large text (for example Light Ruby
on Deep Plum) for headings either, so that headings and body text follow the same rules.

## Contrast ratios (WCAG 2.x)

Thresholds: **AA normal text ≥ 4.5:1**, AA large text (≥ 24px, or ≥ 18.66px bold) ≥ 3:1,
non-text UI components and graphics ≥ 3:1. Ratios are calculated with the WCAG relative
luminance formula and rounded to two decimals.

### Text on backgrounds

| Text | Background | Ratio | AA (normal text) |
|---|---|---|---|
| Off White | Ink Purple | 17.29:1 | ✅ Pass |
| Off White | Deep Plum | 15.60:1 | ✅ Pass |
| Off White | Royal Purple | 11.39:1 | ✅ Pass |
| Ink Purple | Lavender Mist | 16.62:1 | ✅ Pass |
| Ink Purple | Off White | 17.29:1 | ✅ Pass |
| Royal Purple | Lavender Mist | 10.94:1 | ✅ Pass |
| Royal Purple | Off White | 11.39:1 | ✅ Pass |
| Ink Purple | Light Ruby | 4.63:1 | ✅ Pass |
| Off White | Light Ruby | 3.73:1 | ❌ Fail (large text only) |
| White `#FFFFFF` | Light Ruby | 3.96:1 | ❌ Fail (large text only) |
| Ink Purple | Rose Ruby | 7.03:1 | ✅ Pass |
| Off White | Rose Ruby | 2.46:1 | ❌ Fail |
| Light Ruby | Ink Purple | 4.63:1 | ✅ Pass |
| Light Ruby | Deep Plum | 4.18:1 | ❌ Fail (large text only) |
| Light Ruby | Royal Purple | 3.05:1 | ❌ Fail (large text only) |
| Light Ruby | Lavender Mist | 3.59:1 | ❌ Fail (large text only) |
| Light Ruby | Off White | 3.73:1 | ❌ Fail (large text only) |
| Rose Ruby | Ink Purple | 7.03:1 | ✅ Pass |
| Rose Ruby | Deep Plum | 6.34:1 | ✅ Pass |
| Rose Ruby | Royal Purple | 4.63:1 | ✅ Pass |

### Seat numbers on seats

| Text | Seat | Ratio | AA (normal text) |
|---|---|---|---|
| Ink Purple | Free `#4CC38A` | 8.27:1 | ✅ Pass |
| Off White | Free `#4CC38A` | 2.09:1 | ❌ Fail |
| Ink Purple | Reserved `#8E7AA8` | 4.80:1 | ✅ Pass |
| Off White | Reserved `#8E7AA8` | 3.60:1 | ❌ Fail |
| Off White | Sold `#6E2340` | 10.02:1 | ✅ Pass |
| Ink Purple | Sold `#6E2340` | 1.73:1 | ❌ Fail |
| Ink Purple | Selected (Light Ruby) | 4.63:1 | ✅ Pass |

### Seats against the background (non-text, needs ≥ 3:1)

| Seat | on Ink Purple | on Deep Plum | Result |
|---|---|---|---|
| Free `#4CC38A` | 8.27:1 | 7.46:1 | ✅ Pass |
| Reserved `#8E7AA8` | 4.80:1 | 4.33:1 | ✅ Pass |
| Selected `#E0457B` | 4.63:1 | 4.18:1 | ✅ Pass |
| Sold `#6E2340` | 1.73:1 | 1.56:1 | ❌ Fail – the Off White X icon (10.02:1) carries the state |

### Status colors

| Color | as text on Ink Purple | as text on Deep Plum | Ink Purple text on it | AA |
|---|---|---|---|---|
| Success `#4CC38A` | 8.27:1 | 7.46:1 | 8.27:1 | ✅ Pass |
| Warning `#F5B947` | 10.40:1 | 9.38:1 | 10.40:1 | ✅ Pass |
| Error `#FF6464` | 6.34:1 | 5.71:1 | 6.34:1 | ✅ Pass |
| Info `#7DB4F5` | 8.48:1 | 7.65:1 | 8.48:1 | ✅ Pass |

### UI boundaries (non-text, needs ≥ 3:1)

| Element | Background | Ratio | Result |
|---|---|---|---|
| Royal Purple border | Ink Purple | 1.52:1 | ❌ Fail – decorative only |
| Royal Purple border | Deep Plum | 1.37:1 | ❌ Fail – decorative only |
| `--border-strong` `#8E7AA8` | Ink Purple | 4.80:1 | ✅ Pass |
| `--border-strong` `#8E7AA8` | Deep Plum | 4.33:1 | ✅ Pass |
| Rose Ruby focus ring | Ink Purple | 7.03:1 | ✅ Pass |
| Rose Ruby focus ring | Deep Plum | 6.34:1 | ✅ Pass |
