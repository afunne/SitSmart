# SitSmart – Style Guide

Dark theme: dark purple base with light ruby accents. Lavender Mist is used only for light
surfaces (ticket view, print).

The frontend is React with [Radix Themes](https://www.radix-ui.com/themes). Our colors are in
`client/src/styles/theme.css`; `client/src/styles/radix-overrides.css` maps them onto Radix.

## Colors

| Token | Name | Hex | Use |
|---|---|---|---|
| `--ink` | Ink Purple | `#1C0F26` | Page background, text on light backgrounds and on ruby buttons |
| `--plum` | Deep Plum | `#2A1638` | Cards / surfaces |
| `--plum-raised` | Raised Plum | `#3A1F4E` | Hover / selected background (cards, table rows) |
| `--royal` | Royal Purple | `#4B2465` | Header, decorative borders |
| `--ruby` | Light Ruby | `#E0457B` | Primary buttons, selected seat |
| `--rose` | Rose Ruby | `#F27A9F` | Hover, focus ring, links |
| `--mist` | Lavender Mist | `#F7F2FA` | Light surfaces (ticket, print) |
| `--off-white` | Off White | `#FBF7FC` | Text on dark backgrounds |
| `--border-strong` | – | `#8E7AA8` | Input borders, outline buttons |

### Seat states

| State | Hex | Seat number text |
|---|---|---|
| Free | `#4CC38A` | Ink Purple |
| Reserved | `#8E7AA8` | Ink Purple |
| Sold | `#6E2340` | Off White, plus an X icon |
| Selected | `#E0457B` | Ink Purple |

### Status colors

| Status | Hex | Radix color |
|---|---|---|
| Success | `#4CC38A` | `green` |
| Warning | `#F5B947` | `amber` |
| Error | `#FF6464` (hover `#FF8A8A`) | `red` |
| Info | `#7DB4F5` | `blue` |

## Radix theme

`<Theme appearance="dark" accentColor="ruby" grayColor="mauve" radius="large" panelBackground="solid">`

- `ruby` is remapped to Light Ruby / Rose Ruby, `mauve` (gray) to our purples.
- Spacing, radius and font sizes come from Radix (`gap="3"`, `p="4"`, `size="6"`, ...).
- Shadows: none.

## Typography

- Headings: Poppins 600 (`<Heading>`)
- Body, labels, inputs: Inter 400, 500 for emphasis and buttons (`<Text>`)
- Loaded from Google Fonts in `client/index.html`

| Element | Radix size |
|---|---|
| h1 | `8` (35px) |
| h2 | `7` (28px) |
| h3 | `6` (24px) |
| h4 | `5` (20px) |
| Body | `3` (16px) |
| Small | `2` (14px) |

Prices, seat numbers and times use the `tabular` class (`font-variant-numeric: tabular-nums`).

## Icons

Tabler Icons webfont 3.51.0 from jsDelivr (linked in `client/index.html`), e.g.
`<i className="ti ti-ticket" aria-hidden="true" />`.

## Focus

2px Rose Ruby outline with 2px offset on `:focus-visible`.

## Components

| Component | Radix |
|---|---|
| Primary button | `<Button>` |
| Secondary button | `<Button variant="outline" color="gray" highContrast>` |
| Danger button | `<Button color="red">` |
| Input | `<TextField.Root>`; error: `aria-invalid="true"` on it + `<Text color="red">` message |
| Card | `<Card>` (clickable: `<Card asChild><a>`) |
| Status badge | `<Badge color="green" variant="solid">` (+ icon) |
| Neutral badge | `<Badge color="gray">` |
| Table | `<Table.Root variant="surface">` |
| Inline notice | `<Callout.Root color="...">` |
| Layout | `<Container>`, `<Flex>`, `<Grid>`, `<Section>` |

Radix Themes has no toast component. If we need toasts, use `@radix-ui/react-toast`.

## Rules

1. Text on Light Ruby is Ink Purple, never white.
2. Links are Rose Ruby (Radix `<Link>`); Royal Purple on light surfaces.
3. Royal Purple borders are decorative only; use `--border-strong` for borders that must be visible.
4. Status colors: as text on dark backgrounds, or as a fill with Ink Purple text. Not as text on light backgrounds.
5. Don't rely on color alone: sold seats show an X, statuses have an icon, the seat map has a legend.
