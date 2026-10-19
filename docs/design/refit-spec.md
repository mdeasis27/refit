# Refit: design and technical spec

Inputs: [`REQUIREMENTS.md`](../../REQUIREMENTS.md), [PRD](../prd/refit.prd.md).
Plan: [`docs/plan/refit-slices.md`](../plan/refit-slices.md).
Size tier (orch-pipeline Step 0): **large**. New external deps, a CLI contract, a spec doc,
and a security trigger (external LLM API call).

## 1. Architecture (one screen)

```
broken/ (read-only) ──copy-broken──▶ public/broken/ (gitignored, byte-identical)
                                         │
Next.js 16 App Router (Bun)              ▼
  proxy.ts ── locale redirects / 404 ──▶ /{lang}/app        story page (server components)
                                         /{lang}/redesign   client flow, ?step=account|plan|done
                                         /api/audit         live LLM audit (only with env key)
                                         /{lang}/opengraph-image
lib/ (pure, unit-tested): i18n, routing, signup validation, flow reducer, pricing, audit schema
data/ (committed fixtures): audit.json (maintainer), measure.json (written by `measure`)
scripts/measure.mjs (Node 22) ── bun run build ─ next start ─ Playwright + axe ─▶ stdout JSON
                                                                              └▶ data/measure.json
```

## 2. Stack and tooling (locked)

| Concern | Choice | Why |
|---|---|---|
| Runtime / package manager | Bun 1.3.x | brief |
| Framework | Next.js 16.x App Router, React 19 | brief; 16 renames `middleware.ts` to `proxy.ts` |
| Language | TypeScript strict, `noUncheckedIndexedAccess`, no `any`, no `@ts-ignore` | brief |
| Lint/format | Biome 2.x (`noExplicitAny` error, a11y rules on, ban `@ts-ignore` via `suspicious` rules) | `next lint` is gone in Next 16; Biome is one binary with a11y rules |
| Unit tests | `bun test` + `happy-dom` (preload via `bunfig.toml`) + `@testing-library/react` | brief |
| E2E / measure | `playwright` 1.64 + `@axe-core/playwright` 4.14, run by **Node 22** | Playwright hangs under Bun on Windows |
| Validation | `zod` 4 (LLM output, fixture files, routes file, session state) | never trust external data |
| Fonts | `next/font/local`, committed woff2 (OFL) | no network needed at build |
| LLM | `ai-kit/` `chat()` router, untouched; `@google/genai` installed so `GEMINI_API_KEY` works | brief |

Package scripts:

| Script | Command | Notes |
|---|---|---|
| `dev` | `bun run copy-broken && next dev` | |
| `build` | `bun run copy-broken && next build` | |
| `start` | `next start` | |
| `copy-broken` | `bun scripts/copy-broken.ts` | copies `broken/` → `public/broken/`, no transform |
| `test` | `bun test` | unit + component; never launches a browser |
| `test:e2e` | `bun run build && playwright test` | the Playwright CLI has a node shebang, so it runs on Node |
| `typecheck` | `tsc --noEmit` | |
| `lint` | `biome check .` | ignores `ai-kit/`, `broken/`, `public/broken/`, `.next/` |
| `measure` | `node scripts/measure.mjs` | prints JSON only on stdout |

E2E files are named `*.e2e.ts` so `bun test` never collects them.

## 3. Routing (`proxy.ts`, pure core in `lib/routing.ts`)

`resolveRoute(pathname, search): { kind: "next" } | { kind: "redirect", to } | { kind: "notFound" }`

| Input | Result |
|---|---|
| `/_next/*`, `/api/*`, `/broken/*`, any path with a file extension, `*/opengraph-image*` | next (untouched) |
| `/` + `?q` | redirect `/en?q` |
| `/en`, `/es` (+query) | redirect `/{lang}/app` + query |
| `/en/...`, `/es/...` | next |
| first segment is locale-shaped (`^[a-z]{2}(-[A-Za-z]{2})?$`) and not `en`/`es` | notFound (404) |
| anything else, e.g. `/redesign?step=plan` | redirect `/en/redesign?step=plan` |

The `[lang]` segment also uses `generateStaticParams` with `dynamicParams = false`, so an
unknown locale is a 404 even if the proxy is bypassed. Redirects are 307.

## 4. i18n

- `lib/i18n/dictionaries.ts`: `type Dictionary = {...}` declared explicitly;
  `export const dictionaries: Record<"en" | "es", Dictionary>`. A missing key in either
  locale is a type error.
- Covers every visible string, including aria-labels, error messages, document titles, OG
  image text and audit entries (audit fixture strings are `{ en, es }` objects, zod-validated).
- Copy checks in a unit test that walks every string: no `—` (em dash), no banned brand list
  (`Brightdesk`, `Google`, `OpenAI`, `Anthropic`, `Vercel`, `GitHub`, ...). The `Stack: …`
  line and URLs are the only exceptions (by key).

## 5. Redesigned flow (`/{lang}/redesign`)

Screens (URL state via `?step=`, default `account`):

1. **account**: "Create your account". Name (`autocomplete="name"`), email (`type=email`,
   `autocomplete="email"`), password (`autocomplete="new-password"`, show/hide toggle button
   with `aria-pressed`, rule shown up front: at least 8 characters, D-F3). Native `<form>`,
   real `<button type="submit">` "Continue to plan".
2. **plan**: "Choose your plan". `<fieldset>`/`<legend>` radio group, Free / Pro / Team, **Pro
   preselected** (D-F2), prices always visible, formatted from integer cents with
   `Intl.NumberFormat(locale, { style: "currency", currency: "EUR" })`. Review summary (name,
   email, "Edit" link back to step 1). Terms as plain text with an inline `<details>` (no
   forced checkbox, no newsletter). Button "Create account".
3. **done**: "You are in". Shows name and plan; "Start again" button clears state.

Behaviour:
- State: `useReducer` with an immutable reducer (`lib/flow/reducer.ts`), persisted to
  `sessionStorage` (key `refit:flow:v1`, zod-validated on read). No network.
- On step change: `router.push("?step=...")`, update `document.title`, move focus to the
  step heading. The page has exactly one `h1` (the step title). Progress shown as text
  "Step 2 of 3" plus an `<ol>` with `aria-current="step"`.
- Validation on submit (not on each keystroke): an error summary (`role="alert"`, receives
  focus) with links to the fields; each field gets `aria-invalid` and `aria-describedby`
  pointing at its message. Errors are text plus icon, never color only.
- Direct load of `?step=plan` or `?step=done` without state still renders the full screen
  (axe must see the real UI): plan shows "Not entered yet" in the summary, and submitting it
  sends the user to `account` with the error summary. `done` without state shows "Nothing to
  confirm yet" with a link to start (D-F4).
- Unknown `step` value → `account`.
- Layout: single column, works at 375 px, targets ≥ 44 px, visible focus ring (2 px outline
  with offset, ≥ 3:1 against adjacent colors), `prefers-reduced-motion` honored, no
  carousel, landmarks (`header`, `main`, `footer`), skip link.

`refit.routes.json` (committed):
```json
{ "steps": ["/en/redesign", "/en/redesign?step=plan", "/en/redesign?step=done"] }
```

## 6. `measure` contract

`node scripts/measure.mjs [--no-build] [--routes <file>]`

1. Unless `--no-build`: run `bun run build` with child stdout and stderr piped to **our
   stderr**. Only the final JSON reaches stdout.
2. Pick a free port, spawn `next start -p <port>` (output → stderr), poll until HTTP 200.
3. Read and zod-validate the routes file (default `refit.routes.json`). Entries must be
   same-origin paths starting with `/` (absolute URLs to other hosts are rejected, D-M6).
4. Expand: a route whose first segment is a supported locale yields one URL per locale
   (`/en/x` → `/en/x`, `/es/x`); other routes are measured as given (D-M3).
5. For `/broken/index.html` and each expanded URL: fresh browser context (1280×800),
   `goto` (`waitUntil: "networkidle"`), wait for `document.fonts.ready`, then
   `new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"])`
   with no rule disabled (D-M1).
6. Aggregate (D-M2): `violations` = sum over pages of `results.violations.length`;
   `nodes` = sum over pages of every `violation.nodes.length`.
7. Steps (D-M4): `steps.after` = number of entries in `routes.steps`. `steps.before` is
   computed in the old page by `countScreens()`: find groups of ≥ 2 sibling elements where
   one is visible and the others are hidden (`hidden` attribute or computed `display:none`)
   and that each contain an interactive element or heading-like text; the largest group's
   size is the screen count; if no group exists, 1. Overlays/dialogs (fixed position) are
   excluded.
8. Print `{"before":{"violations":n,"nodes":n},"after":{"violations":n,"nodes":n},"steps":{"before":n,"after":n}}`
   on stdout, write the same plus details (per-page rule ids and node counts, axe version,
   timestamp, routes) to `data/measure.json`, and stop the server (process-tree kill on
   win32: `taskkill /PID <pid> /T /F`).
9. Any failure: message on stderr, exit code 1, nothing on stdout. Server always killed
   (`finally`).

Pure helpers live in `scripts/measure-lib.mjs` (`// @ts-check`, JSDoc types, covered by
`checkJs` in tsconfig) so `bun test` can unit-test them without a browser: `expandLocales`,
`aggregate`, `countScreensInDocument` (run against the `broken/` HTML parsed by happy-dom
and against synthetic pages shaped like possible hidden cases), `parseRoutes`.

## 7. Audit

- `data/audit.json`: `{ author: "maintainer", entries: AuditEntry[] }` with
  `AuditEntry = { id, title: {en,es}, where: {en,es}, breaks: { kind: "wcag"|"heuristic", ref, name }[], axeRules: string[], fix: {en,es}, severity: "blocker"|"major"|"minor" }`.
- UI label in demo mode: "Written by me, the maintainer. Not model output."
- Test: every axe rule id recorded for the old page in `data/measure.json` appears in some
  entry's `axeRules` (the audit covers everything the machine found, plus manual findings).
- Live mode (`isLiveMode()` = any of `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`
  set, server-side only): `/{lang}/app` shows a "Run a model audit" button. `POST /api/audit`
  - reads `broken/index.html`, `style.css`, `app.js` from a fixed path (no user input),
  - is rate-limited with the `ai-kit` `rateLimit()` per IP (5 per hour),
  - calls `chat()` with a JSON-only prompt, parses with zod, caps entry count and string
    lengths,
  - returns an `{ ok, data, error }` envelope; error details are logged server-side only and
    the client shows a translated message; on `AllProvidersFailedError` or `RateLimitError`
    the UI falls back to the maintainer audit with a notice.
- Live results are labelled "Generated by a language model, not reviewed" with the
  `ProviderBadge` (provider, model, latency). Rendered as text only, never as HTML.
- Without env vars: no button, `/api/audit` returns 404 `{ ok: false }`, no provider code runs.

### Audit seed list (to verify against real axe output in S4)

| # | Defect in the old flow | Breaks | Redesign answer |
|---|---|---|---|
| 1 | Inputs have placeholders only, no labels | WCAG 1.3.1, 3.3.2, 4.1.2 (`label`) | visible `<label>` per field |
| 2 | "Buttons" are divs: not focusable, no role | 2.1.1, 4.1.2 | native `<button>` |
| 3 | Plan cards mouse-only, selection state visual only | 2.1.1, 4.1.2 | radio group in a fieldset |
| 4 | Prices only on hover | 1.4.13, heuristic: visibility of system status | prices always visible |
| 5 | `user-scalable=no, maximum-scale=1` | 1.4.4 (`meta-viewport`) | default viewport |
| 6 | No `lang` on `<html>` | 3.1.1 (`html-has-lang`) | `lang` per locale |
| 7 | No `<title>` | 2.4.2 (`document-title`) | title per step |
| 8 | Low contrast: notes `#aaa`, button text on light blue, step dots, slides | 1.4.3 (`color-contrast`) | tokens ≥ 4.5:1, documented |
| 9 | `outline: none`, no focus style | 2.4.7, 2.4.11 | visible focus ring |
| 10 | Errors shown only as a red border, not announced | 1.4.1, 3.3.1, 4.1.3 | text errors, summary, `aria-invalid` |
| 11 | Auto-rotating testimonials, no pause | 2.2.2 | removed |
| 12 | Images without `alt` | 1.1.1 (`image-alt`) | no decorative noise; `alt=""` where decorative |
| 13 | Empty icon link and empty bell button; 16 px targets | 2.4.4, 4.1.2, 2.5.8 (`link-name`, `button-name`, `target-size`) | removed; targets ≥ 44 px |
| 14 | Terms dialog: span opener, Tab blocked, no Escape, no dialog role | 2.1.1, 2.1.2, 4.1.2 | inline `<details>`, no modal |
| 15 | Closing the terms dialog with "x" ticks "accept" | heuristic: user control and freedom (consent) | no implied consent |
| 16 | Weekly marketing opt-in is required | heuristic: user control; forced opt-in dark pattern | no newsletter box |
| 17 | 14 inputs for 4 facts (phone, birthdate, company, address...) | heuristic: aesthetic and minimalist design | 3 fields + plan |
| 18 | Repeat email, `type=text` email, no `autocomplete` | 1.3.5, heuristic: error prevention | one `type=email` with autocomplete |
| 19 | Password rule appears only after failing; strict composition rule | 3.3.2, heuristic: error prevention | rule shown up front, length-based |
| 20 | Payment required even for Free | heuristic: match between system and real world | no payment step |
| 21 | Inbox step with a "Submit" that verifies nothing | heuristic: aesthetic and minimalist design | removed |
| 22 | Step bar "1 2 3" for 5 screens, no text, current step not announced | 1.3.1, heuristic: visibility of system status | "Step 1 of 3" text, `aria-current` |
| 23 | No headings, no landmarks (`div.big`) | 1.3.1, 2.4.6 (axe `page-has-heading-one`, `region` are best-practice) | one `h1`, landmarks |
| 24 | Vague buttons: Next, Continue, Proceed, Submit; heading "Pick one" | 2.4.6, heuristic: recognition rather than recall | labels say the outcome |
| 25 | Focus not moved on step change | 2.4.3 | focus to step heading |

## 8. Identity

- Name and wordmark: "refit" in lowercase, set in the display face, with a dashed "stitch"
  underline (SVG, `role="img"` + `aria-label="Refit"`). Metaphor: a tailor refitting a suit.
- Type: display **Bricolage Grotesque**, body **Atkinson Hyperlegible** (designed for
  legibility, fits the subject), mono **JetBrains Mono** for numbers. All OFL, self-hosted.
- Palette (candidate values; the contrast test in S2 is the authority and may adjust them):
  `--paper #F7F3EA`, `--ink #1C1B19`, `--muted #57534A`, `--thread #A6361C` (accent, text use),
  `--thread-strong #7E2814`, `--chalk #FFFFFF`, `--seam #2B5F5A` (success), `--error #A1251B`,
  `--focus #1F4FD1`.
- Tokens live in `app/tokens.css` (single source). `lib/design/contrast.ts` computes WCAG
  relative-luminance ratios; a test parses `tokens.css`, checks every declared text/background
  pair (`lib/design/pairs.ts`) ≥ 4.5 (≥ 3 for focus and non-text), and checks that the table
  in `DESIGN.md` lists the same ratios (rounded to 2 decimals).

## 9. Story page `/{lang}/app`

Top bar: `← All projects` link to `https://portafolio-mdea.vercel.app/{lang}/projects`
(top-left), wordmark, EN/ES switch (links keeping the path, `aria-current` on the active
locale, `hreflang`). Sections in this order, each a `<section aria-labelledby>`:

1. Hero: `h1` "Refit", one-liner, chips (WCAG 2.2 AA, measured with axe, keyboard only, EN/ES).
2. Analogy paragraph (a tailor refitting a suit) and a mini-glossary `<dl>` of 4 terms (axe,
   WCAG, focus, screen).
3. Try it: the two flows side by side (old in an `<iframe title>` of `/broken/index.html` plus
   an "open in a new tab" link; new as a link to `/{lang}/redesign` and an embedded instance of
   the flow component), then the audit list.
4. Compare: before → after violations, nodes, screens, read from `data/measure.json` at build
   time; shows the measure timestamp and axe version. Never hard-coded.
5. Where it fits: worth it when / not needed when.
6. What it proves (first person).
7. `<details>` "For engineers" / "Para ingenieros" (closed): mechanism (axe tags, aggregation,
   screen counting algorithm, thresholds), testing (unit, component, keyboard e2e, measure),
   `Stack: Next.js 16, React 19, TypeScript, Bun, Playwright, axe-core, Biome`, link to
   `https://github.com/mdeasis27/refit`.

The embedded flow on `/app` must not create a second `h1`: the flow component takes a
`headingLevel` prop (`h1` on `/redesign`, `h3` inside the story page).

The story page is not in `refit.routes.json`, so it is not part of the graded number. The e2e
suite still runs axe on `/{lang}/app` excluding the iframe (`.exclude("iframe")`) and expects 0.

`app/[lang]/opengraph-image.tsx`: 1200×630, palette, wordmark, product name and the locale's
one-liner. `generateMetadata` per locale with `alternates.languages`.

## 10. Test strategy

| Layer | Tool | Covers |
|---|---|---|
| Unit | `bun test` | routing table, dictionary copy rules, pricing cents, validation, reducer immutability, session parsing, measure-lib, routes schema, audit schema + axe coverage, contrast + DESIGN.md sync, copy-broken byte equality |
| Component | `bun test` + happy-dom + RTL | flow: labels, Pro default, error summary focus, steps render without state, story page section order, single `h1` |
| E2E | Playwright on Node | keyboard-only completion (en, es); axe 0 (incl. best-practice) on each step and on `/app`; redirects and 404; 375 px without horizontal scroll; `/broken/index.html` byte-identical to `broken/index.html` |
| CLI | `measure` | stdout parses and matches the zod schema (an e2e spec spawns it with `--no-build`) |

Coverage target ≥ 80 % lines on `lib/` and `scripts/measure-lib.mjs` (`bun test --coverage`).

## 11. Decision log (all auto-approved; no human available)

| ID | Decision | Alternatives | Reason |
|---|---|---|---|
| D-P0 | Planning docs in `docs/` not `.claude/prds/` | `.claude/` | `.claude/` is gitignored; docs must be committed |
| D-P1 | Primary user = portfolio reviewer | real signup users | no backend; portfolio rule |
| D-P2 | No external evidence; evidence = source reading + `measure` | invent metrics | anti-fluff rule |
| D-P3 | Next 16 + `proxy.ts` | pin Next 15 | latest stable; fewer deprecations |
| D-P4 | Biome for lint | ESLint flat config | `next lint` removed in 16; simpler |
| D-F1 | Drop payment and inbox steps | keep a fake payment | brief: only name, email, password, plan are needed |
| D-F2 | Pro preselected, Free and Team still offered | only Pro | task says choose Pro; keeping the choice is honest |
| D-F3 | Password: ≥ 8 characters, no composition rule, show/hide | keep 12+ with symbols | NIST SP 800-63B; WCAG 3.3.8 spirit |
| D-F4 | Steps render fully without state | redirect to step 1 | axe and the grader load each URL directly |
| D-F5 | 3 screens (account, plan + confirm, done) | 2 screens | a review-before-commit screen is error prevention (3.3.4 spirit) |
| D-F6 | Terms as inline `<details>`, consent by "Create account" with visible text | checkbox + modal | removes a modal and a forced checkbox |
| D-M1 | axe tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa; no rule disabled | add best-practice | brief says "WCAG 2.2 AA tags"; best-practice is checked in e2e instead |
| D-M2 | violations = sum of failed rules per page; nodes = sum of failing nodes | distinct rule ids across pages | per-page sum is what re-running axe on each route yields |
| D-M3 | routes file lists `en` only; measure expands to all locales; `steps.after` = list length | list both locales | brief example starts with `/en/redesign`; grader measures both locales |
| D-M4 | `steps.before` from DOM screen-group detection | hard-code 5; scripted walkthrough | generic for hidden cases, no typed numbers |
| D-M5 | `measure` builds itself, build logs go to stderr, `--no-build` flag | assume prebuilt | brief: "Builds and serves the app" |
| D-M6 | reject routes that are not same-origin paths | allow any URL | avoid fetching arbitrary hosts |
| D-M7 | `measure` also writes `data/measure.json` (committed), read by Compare | run axe at page runtime | Compare must show numbers produced by `measure` |
| D-A1 | LLM audit input is fixed (old flow source), no user text | user-pasted HTML | removes prompt-injection and SSRF surface |
| D-A2 | Self-hosted fonts via `next/font/local` | `next/font/google` | offline builds |
| D-A3 | Install `@google/genai` | rely on Groq/OpenRouter only | `GEMINI_API_KEY` should work as the router expects |
| D-A4 | Never edit `ai-kit/`; if it fails strict tsc, import only the files needed (`router`, `errors`, `rate-limit`, `demo-mode`, `provider-badge`) and record the issue | patch it | vendored rule |
