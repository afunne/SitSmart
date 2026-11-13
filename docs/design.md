# SitSmart – Style Guide

Dark theme: dark purple base with light ruby accents. Lavender Mist is used only for light
surfaces (ticket view, print). All tokens are in `Piletimyyk.Api/wwwroot/css/theme.css`.

## Colors

| Token | Name | Hex | Use |
|---|---|---|---|
| `--ink` | Ink Purple | `#1C0F26` | Page background, text on light backgrounds and on ruby buttons |
| `--plum` | Deep Plum | `#2A1638` | Cards / surfaces |
| `--plum-raised` | Raised Plum | `#3A1F4E` | Hover / selected background (cards, table rows) |
| `--royal` | Royal Purple | `#4B2465` | Header, decorative borders, table header |
| `--ruby` | Light Ruby | `#E0457B` | Primary buttons, links on Ink Purple, selected seat |
| `--rose` | Rose Ruby | `#F27A9F` | Hover, focus ring, links on Deep Plum |
| `--mist` | Lavender Mist | `#F7F2FA` | Light surfaces (ticket, print) |
| `--off-white` | Off White | `#FBF7FC` | Text on dark backgrounds |
| `--border-strong` | – | `#8E7AA8` | Input borders, outline buttons, placeholders |

### Seat states

| State | Hex | Seat number text |
|---|---|---|
| Free | `#4CC38A` | Ink Purple |
| Reserved | `#8E7AA8` | Ink Purple |
| Sold | `#6E2340` | Off White, plus an X icon |
| Selected | `#E0457B` | Ink Purple |

### Status colors

| Status | Hex |
|---|---|
| Success | `#4CC38A` |
| Warning | `#F5B947` |
| Error | `#FF6464` (hover `#FF8A8A`) |
| Info | `#7DB4F5` |

## Typography

- Headings (h1–h4): Poppins 600, line height 1.2
- Body, labels, inputs: Inter 400, 500 for emphasis and buttons, line height 1.6
- Loaded from Google Fonts

| Element | Size |
|---|---|
| h1 | 2.25rem (36px) |
| h2 | 1.75rem (28px) |
| h3 | 1.375rem (22px) |
| h4 | 1.125rem (18px) |
| Body | 1rem (16px) |
| Small | 0.875rem (14px) |
| Button | 0.95rem (≈15px) |

Prices, seat numbers and times use `font-variant-numeric: tabular-nums`.

## Spacing, radius, shadows

- Spacing: 4, 8, 12, 16, 24, 32, 48px (`--space-1` to `--space-7`)
- Radius: 6px (inputs), 10px (buttons, toasts), 16px (cards)
- Shadows: none

## Icons

Tabler Icons webfont 3.51.0 from jsDelivr (linked in `index.html`), e.g.
`<i class="ti ti-ticket" aria-hidden="true"></i>`.

## Focus

2px Rose Ruby outline with 2px offset on `:focus-visible`. Royal Purple on light surfaces.

## Components

States: default / hover / active / disabled. All focusable elements use the focus ring above.

### Buttons

| Variant | Default | Hover | Active |
|---|---|---|---|
| Primary | Light Ruby, Ink Purple text | Rose Ruby | Light Ruby, moves down 1px |
| Secondary | Transparent, `--border-strong` outline, Off White text | Royal Purple fill | Royal Purple fill, moves down 1px |
| Danger | Error red, Ink Purple text | `#FF8A8A` | Error red, moves down 1px |

Disabled (all variants): transparent, Royal Purple border, `#8E7AA8` text, no hover.
Height 44px.

### Inputs

- Default: Ink Purple background, `--border-strong` border, Off White text
- Hover: Off White border
- Disabled: Deep Plum background, Royal Purple border, `#8E7AA8` text
- Error: Error red border and an error message below with an alert icon
- Label always above the input

### Cards

- Deep Plum background, Royal Purple border, 16px radius
- Clickable cards: hover Raised Plum + `--border-strong` border, active moves down 1px
- Unavailable (e.g. sold out): not clickable, shows a badge

### Badges

Pill shape, small text. Neutral = Royal Purple with Off White text; status badges = status
color with Ink Purple text and an icon. Not interactive.

### Tables

- Header: Royal Purple, Off White text
- Rows: Deep Plum, hover Raised Plum
- Selected row: Raised Plum + Light Ruby bar on the left
- Numbers right-aligned

### Toasts

- Bottom right, Deep Plum background, `--border-strong` border, colored left border and icon
- Success / info close after 5s; warning / error stay until closed
- Close button: transparent, Royal Purple on hover

## Rules

1. Text on Light Ruby is Ink Purple, never white.
2. Links: Light Ruby on Ink Purple, Rose Ruby on Deep Plum, Royal Purple on light surfaces.
3. Royal Purple borders are decorative only; use `--border-strong` for borders that must be visible.
4. Status colors: as text on dark backgrounds, or as a fill with Ink Purple text. Not as text on light backgrounds.
5. Don't rely on color alone: sold seats show an X, statuses have an icon, the seat map has a legend.
