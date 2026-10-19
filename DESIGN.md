# Refit design

Refit's identity is a tailor's workshop: warm paper, dark ink, and a red thread that marks
the places where something was mended. It is its own system, defined in `app/tokens.css`
and not shared with any other project. Every text and non-text pair below is checked by
`test/tokens.test.ts`, which also fails if this table drifts from the real values.

## Palette

| Token | Hex | Role |
|---|---|---|
| `paper` | `#f7f3ea` | Page background |
| `chalk` | `#ffffff` | Cards, fields |
| `ink` | `#1c1b19` | Body text, dark blocks |
| `muted` | `#57534a` | Secondary text, hints |
| `thread` | `#a6361c` | Accent: links, marks |
| `thread-strong` | `#7e2814` | Primary button background |
| `seam` | `#2b5f5a` | Success |
| `error` | `#a1251b` | Errors (always with text and an icon) |
| `focus` | `#1f4fd1` | Focus ring |
| `line` | `#7a7568` | Borders of fields and cards |
| `wash` | `#ece5d3` | Quiet fills with no text contrast requirement |

## Contrast of each pair

Ratios are WCAG 2.x relative-luminance ratios, rounded down to two decimals. Text needs 4.5:1
(AA). Focus ring and borders are non-text and need 3:1 (WCAG 1.4.11).

| Foreground | Background | Use | Ratio | Needs | AA |
|---|---|---|---|---|---|
| `ink` | `paper` | Body text on the page | 15.54:1 | 4.5:1 | Pass |
| `ink` | `chalk` | Body text on cards and fields | 17.21:1 | 4.5:1 | Pass |
| `muted` | `paper` | Secondary text on the page | 6.91:1 | 4.5:1 | Pass |
| `muted` | `chalk` | Hints and notes on cards | 7.66:1 | 4.5:1 | Pass |
| `thread` | `paper` | Links and accent text on the page | 5.98:1 | 4.5:1 | Pass |
| `thread` | `chalk` | Links and accent text on cards | 6.63:1 | 4.5:1 | Pass |
| `chalk` | `thread-strong` | Primary button label | 9.54:1 | 4.5:1 | Pass |
| `chalk` | `ink` | Text on dark blocks | 17.21:1 | 4.5:1 | Pass |
| `seam` | `paper` | Success text on the page | 6.56:1 | 4.5:1 | Pass |
| `seam` | `chalk` | Success text on cards | 7.27:1 | 4.5:1 | Pass |
| `error` | `paper` | Error text on the page | 6.78:1 | 4.5:1 | Pass |
| `error` | `chalk` | Error text on cards and fields | 7.51:1 | 4.5:1 | Pass |
| `focus` | `paper` | Focus ring against the page | 6.12:1 | 3:1 | Pass |
| `focus` | `chalk` | Focus ring against cards | 6.78:1 | 3:1 | Pass |
| `line` | `chalk` | Field and card borders | 4.59:1 | 3:1 | Pass |
| `line` | `paper` | Field borders on the page | 4.14:1 | 3:1 | Pass |

## Typography

| Role | Family | Notes |
|---|---|---|
| Display (headings, wordmark) | Bricolage Grotesque, variable | self-hosted, OFL |
| Body | Atkinson Hyperlegible 400 and 700 | made for legibility, self-hosted, OFL |
| Numbers | JetBrains Mono, variable | self-hosted, OFL; licenses in `app/fonts/` |

Scale: 0.9375rem, 1.0625rem (body), 1.375rem, 2rem, then a fluid `clamp` for the page title.
Line height 1.55 for body, 1.15 for headings. Line length capped at 38rem.

## Spacing, shape, targets

Spacing steps 0.25, 0.5, 0.75, 1, 1.5, 2.5, 4 rem. Radius 0.5rem. Every control is at least
2.75rem (44 px) tall and wide, which is above the WCAG 2.2 minimum of 24 px.

## Focus

Every focusable element gets a 3 px `focus` outline with a 2 px offset on `:focus-visible`.
The ring is never removed. It is 6.12:1 against `paper` and 6.78:1 against `chalk`.

## Motion

None is needed to use the product. Transitions are short and switched off under
`prefers-reduced-motion: reduce`. There is no carousel and nothing moves on its own.

## Wordmark

"refit" in lowercase Bricolage Grotesque with a dashed red stitch under it. It is an inline
SVG with the accessible name "Refit". Use it on `paper` or `chalk` only.

## Layout

One column, designed from 375 px up. Landmarks: header, main, footer. A skip link is the
first focusable element on every page.
