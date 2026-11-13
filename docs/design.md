# SitSmart – Style Guide

Dark purple base with light ruby accents. The app uses a dark theme; Lavender Mist is used only
for light surfaces such as the ticket view and print.

## Palette

| Token | Name | Hex | Use |
|---|---|---|---|
| `--ink` | Ink Purple | `#1C0F26` | Page background (dark theme), text on light backgrounds and on ruby buttons |
| `--plum` | Deep Plum | `#2A1638` | Cards / surfaces |
| `--plum-raised` | Raised Plum | `#3A1F4E` | Hover / selected background for cards and table rows |
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
| Error hover | `#FF8A8A` | Hover background of the danger button only |
| Info | `#7DB4F5` | Neutral notices |

Use status colors as text/icons on Ink Purple or Deep Plum, or as a fill with **Ink Purple** text.
Don't use them as text on light backgrounds (e.g. Success on Lavender Mist is 2.01:1); on the
ticket/print view use Ink Purple text with a colored icon or left border instead.

## CSS variables

```css
:root {
  --ink: #1C0F26;
  --plum: #2A1638;
  --plum-raised: #3A1F4E;
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
  --error-hover: #FF8A8A;
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
3. **Secondary buttons:** outline style. Transparent background, `--border-strong` border, Off White
   text (17.29:1 on Ink Purple, 15.60:1 on Deep Plum). On hover they fill with Royal Purple (Off White
   text 11.39:1). See [Buttons](#buttons).
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

## Components

Every interactive component is described in five states: **default**, **hover**, **active**
(pressed / selected), **disabled** and **focus**. A "–" means the state does not apply to that
component. Don't add it.

### Shared tokens

```css
:root {
  --radius-sm: 6px;   /* inputs, small buttons */
  --radius: 8px;      /* buttons, toasts */
  --radius-lg: 12px;  /* cards */
  --transition: 120ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }
}
```

### Focus ring

All focusable elements share one focus style: **2px Rose Ruby outline with a 2px offset**. The
offset means the ring is drawn against the surrounding surface, not the component itself, so
its contrast is 7.03:1 on Ink Purple, 6.34:1 on Deep Plum and 4.63:1 on Royal Purple (table
headers). On light surfaces (ticket view, print) the ring is Royal Purple (10.94:1 on Lavender
Mist).

```css
:focus-visible {
  outline: 2px solid var(--rose);
  outline-offset: 2px;
}

.surface-light :focus-visible {
  outline-color: var(--royal);
}
```

- Use `:focus-visible`, not `:focus`. Mouse clicks on buttons don't show the ring; keyboard
  focus and text inputs always do.
- Never set `outline: none` unless the component draws the same ring somewhere else
  (see [interactive cards](#cards)). Avoid `all: unset` on buttons, because it also removes
  the outline.
- Use `outline`, not `box-shadow`, for the ring. Outlines stay visible in Windows
  high-contrast (forced colors) mode.

### Icons

Icons come from [Tabler Icons](https://tabler.io/icons) as a webfont, loaded from jsDelivr.
The version is pinned and the file is checked with Subresource Integrity:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.51.0/dist/tabler-icons.min.css"
      integrity="sha384-P44j/HHNN5m29p+nE2nqnDXPOZ32924X4FAAjAPkh9zcNXUSRjpEBAPYHHOw+0Zb"
      crossorigin="anonymous">
```

```html
<i class="ti ti-ticket" aria-hidden="true"></i>
```

- When you update the version, recalculate the `integrity` hash. Otherwise the browser blocks
  the stylesheet:
  `curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`
- Icons use `currentColor`, so they take the text color of their parent. Use the default size
  (1em) next to text and `1.25rem` for standalone icons.
- Decorative icons next to text get `aria-hidden="true"`. Icon-only buttons get an
  `aria-label` that describes the action (for example `aria-label="Close notification"`).
- Icons as non-text graphics need 3:1 against their background. Every color pair in the
  [contrast tables](#contrast-ratios-wcag-2x) that passes for text also passes for icons.

| Meaning | Icon class |
|---|---|
| Sold seat (the required X) / close | `ti-x` |
| Seat | `ti-armchair` |
| Ticket | `ti-ticket` |
| Date and time | `ti-calendar-event` |
| Venue | `ti-map-pin` |
| Success | `ti-circle-check` |
| Warning | `ti-alert-triangle` |
| Error | `ti-alert-circle` |
| Info | `ti-info-circle` |
| Delete / cancel reservation | `ti-trash` |
| Search | `ti-search` |
| Loading (spinning) | `ti-loader-2` |
| Sortable column / ascending / descending | `ti-arrows-sort` / `ti-arrow-up` / `ti-arrow-down` |

### Buttons

Size: `min-height: 2.75rem` (44px), padding `0.625rem 1.25rem`, radius `--radius`. Label in
the Button text style (Inter 500, 0.95rem). Icon and label are separated by a `0.5rem` gap.

| Variant | Default | Hover | Active (pressed) |
|---|---|---|---|
| **Primary** | Light Ruby background, Ink Purple text (4.63:1) | Rose Ruby background, Ink Purple text (7.03:1) | Light Ruby background, moves down 1px |
| **Secondary** | Transparent, 1px `--border-strong` border, Off White text (17.29:1 on Ink Purple, 15.60:1 on Deep Plum) | Royal Purple background, Off White text (11.39:1) | Royal Purple background, moves down 1px |
| **Danger** | Error `#FF6464` background, Ink Purple text (6.34:1) | `--error-hover` `#FF8A8A` background, Ink Purple text (8.08:1) | Error background, moves down 1px |

| State | All variants |
|---|---|
| **Disabled** | Transparent background, 1px Royal Purple border, `--border-strong` text, `cursor: not-allowed`, no hover or active change. WCAG does not require contrast for disabled controls, but the label stays readable (4.80:1 on Ink Purple, 4.33:1 on Deep Plum). |
| **Focus** | The shared [focus ring](#focus-ring). |

Usage:

- Use at most one primary button per view, for the main action (for example "Reserve seats").
- Use the danger button only for destructive actions (cancel reservation, delete event). Pair
  it with a secondary "Keep" or "Back" button.
- Disable with the `disabled` attribute. Use `aria-disabled="true"` only if the button has to
  stay focusable (for example to show a tooltip explaining why it is disabled). Then the click
  handler must ignore clicks itself.
- Don't use opacity for the disabled state, because it makes the label hard to read.

```html
<button class="btn btn-primary"><i class="ti ti-ticket" aria-hidden="true"></i>Reserve seats</button>
<button class="btn btn-secondary">Back</button>
<button class="btn btn-danger"><i class="ti ti-trash" aria-hidden="true"></i>Cancel reservation</button>
<button class="btn btn-primary" disabled>Reserve seats</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color var(--transition), border-color var(--transition),
              transform var(--transition);
}
.btn:active:not(:disabled, [aria-disabled="true"]) { transform: translateY(1px); }

.btn-primary { background: var(--ruby); color: var(--ink); }
.btn-primary:hover { background: var(--rose); }
.btn-primary:active { background: var(--ruby); }

.btn-secondary {
  background: transparent;
  border-color: var(--border-strong);
  color: var(--off-white);
}
.btn-secondary:hover,
.btn-secondary:active { background: var(--royal); }

.btn-danger { background: var(--error); color: var(--ink); }
.btn-danger:hover { background: var(--error-hover); }
.btn-danger:active { background: var(--error); }

/* Keep this block last so that it overrides the hover and active rules above. */
.btn:disabled,
.btn[aria-disabled="true"] {
  background: transparent;
  border-color: var(--royal);
  color: var(--border-strong);
  cursor: not-allowed;
}
```

### Inputs

A field consists of a label above the input, the input itself and, when needed, an error
message below it. The same styles apply to `<input>`, `<select>` and `<textarea>`.

| State | Style |
|---|---|
| **Default** | Ink Purple background, 1px `--border-strong` border (4.80:1 on Ink Purple, 4.33:1 on Deep Plum), Off White text. Placeholder in `--border-strong` (4.80:1 on the Ink Purple input background). |
| **Hover** | Border changes to Off White. |
| **Active** | – (while typing, the input is in the focus state). |
| **Focus** | The shared [focus ring](#focus-ring) around the input. The border does not change. |
| **Disabled** | Deep Plum background, Royal Purple border, `--border-strong` text, `cursor: not-allowed`. |
| **Error** | Border in Error `#FF6464`, drawn 2px wide with an inset shadow so the layout doesn't shift (6.34:1 on Ink Purple). Below the input: an error message in Error color, Small text size, with the `ti-alert-circle` icon (6.34:1 on Ink Purple, 5.71:1 on Deep Plum). The error border stays when the input is hovered or focused. |

Rules:

- The label is always visible (Inter 500, Small size, Off White). Don't use the placeholder
  as the label.
- Help text below an input is Off White. `--border-strong` is only 4.33:1 on Deep Plum, which
  is too low for text on a card.
- Error messages say what to do, for example "Enter an email address, e.g. name@example.com",
  not "Invalid input".
- Validate on blur and on submit, not on every keystroke. After a failed submit, move focus to
  the first invalid field.
- Connect the message to the input with `aria-invalid="true"` and `aria-describedby`. The
  red border alone is not enough, because the error must not rely on color only.

```html
<div class="field">
  <label for="email">Email</label>
  <input id="email" type="email" class="input"
         aria-invalid="true" aria-describedby="email-error">
  <p id="email-error" class="field-error">
    <i class="ti ti-alert-circle" aria-hidden="true"></i>
    Enter an email address, e.g. name@example.com
  </p>
</div>
```

```css
.field { display: grid; gap: 0.375rem; }

.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--off-white);
}

.input {
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  background: var(--ink);
  color: var(--off-white);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  font: inherit;
  transition: border-color var(--transition);
}
.input::placeholder { color: var(--border-strong); }
.input:hover { border-color: var(--off-white); }

.input[aria-invalid="true"] {
  border-color: var(--error);
  box-shadow: inset 0 0 0 1px var(--error);
}

.input:disabled {
  background: var(--plum);
  border-color: var(--royal);
  color: var(--border-strong);
  cursor: not-allowed;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  font-size: 0.875rem;
  color: var(--error);
}
```

### Cards

Cards group content on the Ink Purple page: Deep Plum background, 1px Royal Purple border
(decorative), radius `--radius-lg`, padding `1.5rem`, Off White text. Links inside a card are
Rose Ruby (see Rule 2).

A **static card** (for example an order summary) has only the default state. An
**interactive card** (for example an event in the event list) opens a page when clicked. The
heading link is stretched over the whole card, so there is one link per card and one tab stop.

| State | Static card | Interactive card |
|---|---|---|
| **Default** | Deep Plum background, Royal Purple border | Same |
| **Hover** | – | `--plum-raised` background (Off White text 13.33:1, Rose Ruby 5.42:1), `--border-strong` border |
| **Active** | – | Moves down 1px |
| **Disabled** | – | For example a sold-out or past event. The card is not a link and gets no hover state. Text stays Off White and a badge gives the reason ("Sold out"). Don't use opacity. |
| **Focus** | – | The [focus ring](#focus-ring) is drawn around the whole card, not just the heading link. |

```html
<article class="card card--interactive">
  <h3><a class="card-link" href="/events/42">Autumn Gala Concert</a></h3>
  <p><i class="ti ti-calendar-event" aria-hidden="true"></i> 14.12.2026 19:00</p>
  <p><i class="ti ti-map-pin" aria-hidden="true"></i> Main Hall</p>
</article>
```

```css
.card {
  background: var(--plum);
  border: 1px solid var(--royal);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  color: var(--off-white);
}

.card--interactive {
  position: relative;
  transition: background-color var(--transition), border-color var(--transition),
              transform var(--transition);
}
.card--interactive:hover {
  background: var(--plum-raised);
  border-color: var(--border-strong);
}
.card--interactive:active { transform: translateY(1px); }

.card-link { color: inherit; text-decoration: none; }
.card-link::after {          /* makes the whole card clickable */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

/* Draw the focus ring on the card instead of on the heading link. */
.card--interactive:has(.card-link:focus-visible) {
  outline: 2px solid var(--rose);
  outline-offset: 2px;
}
.card-link:focus-visible { outline: none; }
```

If an interactive card contains another button or link, give that element
`position: relative; z-index: 1` so the stretched link doesn't cover it.

### Badges

Small labels for status, for example "Sold out", "Paid" or "Expires soon". Pill shape
(`border-radius: 999px`), padding `0.125rem 0.625rem`, Inter 500 at Small size, with an icon.

| Variant | Background | Text | Contrast | Icon |
|---|---|---|---|---|
| Neutral | Royal Purple | Off White | 11.39:1 | optional |
| Success | `#4CC38A` | Ink Purple | 8.27:1 | `ti-circle-check` |
| Warning | `#F5B947` | Ink Purple | 10.40:1 | `ti-alert-triangle` |
| Error | `#FF6464` | Ink Purple | 6.34:1 | `ti-alert-circle` |
| Info | `#7DB4F5` | Ink Purple | 8.48:1 | `ti-info-circle` |

States: badges only have the **default** state. Hover, active, disabled and focus are "–".
Badges are not interactive. If something has to be clickable, use a button instead of making
a badge clickable.

Status badges have Ink Purple text on a color fill, so they also work on light surfaces
(ticket view).

```html
<span class="badge badge--warning"><i class="ti ti-alert-triangle" aria-hidden="true"></i>Expires soon</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.6;
  background: var(--royal);
  color: var(--off-white);
}
.badge--success { background: var(--success); color: var(--ink); }
.badge--warning { background: var(--warning); color: var(--ink); }
.badge--error   { background: var(--error);   color: var(--ink); }
.badge--info    { background: var(--info);    color: var(--ink); }
```

### Tables

Used for lists such as reservations, orders and the admin event list.

- Header row: Royal Purple background, Off White text (11.39:1), Inter 500, aligned left.
- Body: Deep Plum background, rows separated by a 1px Royal Purple line (decorative).
  Cell padding `0.75rem 1rem`.
- Numeric columns (price, seat, row, count) are right-aligned and use `tabular-nums`.
- Links in cells are Rose Ruby. Status is shown with a [badge](#badges), not with colored text
  alone.
- On narrow screens the table scrolls horizontally inside a wrapper. The wrapper is focusable
  so keyboard users can scroll it.

| State | Style |
|---|---|
| **Default** | Deep Plum row |
| **Hover** | Row background `--plum-raised`. Everything that is allowed on Deep Plum stays readable: Off White 13.33:1, Rose Ruby 5.42:1, status colors 4.89:1 or higher. |
| **Active (selected)** | `--plum-raised` background and a 3px Light Ruby bar on the left edge (3.57:1). Selection is also shown by a checked checkbox in the first cell, so it doesn't rely on color. |
| **Disabled** | –. For an unavailable row (for example a cancelled reservation) keep the text Off White and add a badge. Don't grey out the row. |
| **Focus** | Rows are not focusable. Links, buttons and sortable column headers inside the table get the shared [focus ring](#focus-ring) (4.63:1 on the Royal Purple header). |

Sortable columns put a button inside the `<th>` and set `aria-sort` on the `<th>` of the
sorted column.

```html
<div class="table-wrap" role="region" aria-label="My reservations" tabindex="0">
  <table class="table">
    <thead>
      <tr>
        <th scope="col">Event</th>
        <th scope="col" class="num" aria-sort="ascending">
          <button class="th-sort">Price <i class="ti ti-arrow-up" aria-hidden="true"></i></button>
        </th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><a href="/events/42">Autumn Gala Concert</a></td>
        <td class="num">24.00 €</td>
        <td><span class="badge badge--success"><i class="ti ti-circle-check" aria-hidden="true"></i>Paid</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.table-wrap { overflow-x: auto; border-radius: var(--radius-lg); }

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--plum);
  color: var(--off-white);
}
.table th,
.table td { padding: 0.75rem 1rem; text-align: left; }
.table th { background: var(--royal); font-weight: 500; }
.table td { border-top: 1px solid var(--royal); }
.table .num { text-align: right; font-variant-numeric: tabular-nums; }
.table a { color: var(--rose); }

.table tbody tr:hover,
.table tbody tr.is-selected { background: var(--plum-raised); }
.table tbody tr.is-selected td:first-child { box-shadow: inset 3px 0 0 var(--ruby); }

.th-sort {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.th-sort:hover { text-decoration: underline; }
```

### Toasts

Short, temporary messages about the result of an action, for example "Seats reserved" or
"Payment failed". They appear in the bottom-right corner (bottom-center on small screens),
stacked, at most `24rem` wide.

Style: Deep Plum background, 1px `--border-strong` border (so the toast stands out from the
content behind it), a 4px left border and an icon in the status color, Off White text with
the title in Inter 500, and a shadow.

| Variant | Accent and icon | Screen reader | Dismissal |
|---|---|---|---|
| Success | `#4CC38A`, `ti-circle-check` | `role="status"` (polite) | Closes after 5s |
| Info | `#7DB4F5`, `ti-info-circle` | `role="status"` (polite) | Closes after 5s |
| Warning | `#F5B947`, `ti-alert-triangle` | `role="alert"` (assertive) | Stays until closed |
| Error | `#FF6464`, `ti-alert-circle` | `role="alert"` (assertive) | Stays until closed |

All accent colors are 5.71:1 or higher on Deep Plum.

States: the toast itself only has the **default** state. Its close button (icon-only, 2rem
square, `aria-label="Close notification"`) has these states:

| State | Close button |
|---|---|
| **Default** | Transparent background, Off White `ti-x` icon (15.60:1) |
| **Hover** | Royal Purple background (icon 11.39:1) |
| **Active** | Royal Purple background, moves down 1px |
| **Disabled** | – |
| **Focus** | The shared [focus ring](#focus-ring) (6.34:1 on Deep Plum) |

Rules:

- Toasts that close automatically pause their timer while the pointer is over them or focus
  is inside them.
- Never put the only way to do something in a toast. If a toast has an action button (for
  example "Undo"), the same action must also be available somewhere else on the page.
- The two live regions have to be in the page from the start. Screen readers often don't
  announce a live region that is added at the same time as its content. Add new toasts inside
  the existing regions.

```html
<!-- In the page layout, present from the start -->
<div class="toast-region">
  <div role="status"></div>  <!-- success, info -->
  <div role="alert"></div>   <!-- warning, error -->
</div>

<!-- A toast, added inside the matching region -->
<div class="toast toast--error">
  <i class="ti ti-alert-circle toast-icon" aria-hidden="true"></i>
  <div>
    <p class="toast-title">Payment failed</p>
    <p>Your seats are held for 10 more minutes. Try another card.</p>
  </div>
  <button class="toast-close" aria-label="Close notification">
    <i class="ti ti-x" aria-hidden="true"></i>
  </button>
</div>
```

```css
.toast-region {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1000;
  display: grid;
  gap: 0.5rem;
  width: min(24rem, calc(100vw - 2rem));
}
.toast-region > div { display: grid; gap: 0.5rem; }

@media (max-width: 30rem) {
  .toast-region { right: 50%; transform: translateX(50%); }
}

.toast {
  --toast-color: var(--info);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--plum);
  color: var(--off-white);
  border: 1px solid var(--border-strong);
  border-left: 4px solid var(--toast-color);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
}
.toast--success { --toast-color: var(--success); }
.toast--warning { --toast-color: var(--warning); }
.toast--error   { --toast-color: var(--error); }

.toast p { margin: 0; }
.toast-title { font-weight: 500; }
.toast-icon { color: var(--toast-color); font-size: 1.25rem; }

.toast-close {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--off-white);
  cursor: pointer;
  transition: background-color var(--transition), transform var(--transition);
}
.toast-close:hover,
.toast-close:active { background: var(--royal); }
.toast-close:active { transform: translateY(1px); }
```

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
| Off White | Raised Plum | 13.33:1 | ✅ Pass |
| Rose Ruby | Raised Plum | 5.42:1 | ✅ Pass |
| `--border-strong` `#8E7AA8` | Ink Purple | 4.80:1 | ✅ Pass (placeholder, disabled label) |
| `--border-strong` `#8E7AA8` | Deep Plum | 4.33:1 | ❌ Fail – disabled controls only (exempt) |
| `--border-strong` `#8E7AA8` | Raised Plum | 3.70:1 | ❌ Fail – don't use as text |
| Ink Purple | Error hover `#FF8A8A` | 8.08:1 | ✅ Pass |

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

| Color | as text on Ink Purple | as text on Deep Plum | as text on Raised Plum | Ink Purple text on it | AA |
|---|---|---|---|---|---|
| Success `#4CC38A` | 8.27:1 | 7.46:1 | 6.38:1 | 8.27:1 | ✅ Pass |
| Warning `#F5B947` | 10.40:1 | 9.38:1 | 8.02:1 | 10.40:1 | ✅ Pass |
| Error `#FF6464` | 6.34:1 | 5.71:1 | 4.89:1 | 6.34:1 | ✅ Pass |
| Info `#7DB4F5` | 8.48:1 | 7.65:1 | 6.54:1 | 8.48:1 | ✅ Pass |

### UI boundaries (non-text, needs ≥ 3:1)

| Element | Background | Ratio | Result |
|---|---|---|---|
| Royal Purple border | Ink Purple | 1.52:1 | ❌ Fail – decorative only |
| Royal Purple border | Deep Plum | 1.37:1 | ❌ Fail – decorative only |
| `--border-strong` `#8E7AA8` | Ink Purple | 4.80:1 | ✅ Pass |
| `--border-strong` `#8E7AA8` | Deep Plum | 4.33:1 | ✅ Pass |
| Rose Ruby focus ring | Ink Purple | 7.03:1 | ✅ Pass |
| Rose Ruby focus ring | Deep Plum | 6.34:1 | ✅ Pass |
| Rose Ruby focus ring | Royal Purple (table header) | 4.63:1 | ✅ Pass |
| Royal Purple focus ring | Lavender Mist | 10.94:1 | ✅ Pass |
| `--border-strong` `#8E7AA8` | Raised Plum (hovered card) | 3.70:1 | ✅ Pass |
| `--border-strong` `#8E7AA8` | Royal Purple (secondary button in header) | 3.16:1 | ✅ Pass |
| Error input border `#FF6464` | Ink Purple | 6.34:1 | ✅ Pass |
| Light Ruby selected-row bar | Raised Plum | 3.57:1 | ✅ Pass |
