# Refit: implementation plan (orch-build-mvp slice plan)

PRD: [`docs/prd/refit.prd.md`](../prd/refit.prd.md) · Spec: [`docs/design/refit-spec.md`](../design/refit-spec.md)

**Operation:** orch-build-mvp · **Size tier:** large (phases 0 → 1 → 2 → 3 → 4 → 5 → 6).
**GATE 1 (slice plan): APPROVED** (auto-approved, no human available, 2026-10-16).
**GATE 2 (commit):** pre-approved for each slice once its checks are green and review has no
open CRITICAL/HIGH findings.

## Ground rules for every slice

1. TDD (`tdd-guide` / `tdd-workflow`): write the failing test, run it red, implement, green,
   refactor. Pure logic goes in `lib/` (or `scripts/measure-lib.mjs`) so it is testable
   without a browser.
2. Never edit `broken/` or `ai-kit/`. A unit test hashes `broken/*` against
   `broken.sha256` (committed in S0) to catch accidental edits.
3. Every visible string goes through the typed dictionary (`Record<"en" | "es", Dictionary>`).
4. Slice gate before its commit: `bun run typecheck && bun run lint && bun test` green; from
   S1 on, `bun run measure` prints valid JSON; from S3 on, `bun run test:e2e` green.
5. Review: `code-reviewer` + `typescript-reviewer` (and `react-reviewer` on `.tsx`) on the
   slice diff; `security-reviewer` on S1 (spawns processes, writes files) and S4 (external
   API, env secrets, rate limiting). Fix CRITICAL/HIGH before committing.
6. One conventional commit per slice (more if a slice splits cleanly), ending with the
   attribution trailer.
7. MVP inner loop: S3 and S5 may run through `/gan-build --skip-planner`, using the
   acceptance lists below as `gan-harness/eval-rubric.md` (pass threshold 8/10, max 3 iterations).

## Research and reuse (phase 1, done during planning)

- Versions checked on the npm registry (2026-10-16): next 16.4.2, react 19.3.1,
  @axe-core/playwright 4.14.0, playwright 1.64.1, @biomejs/biome 2.5.15, zod 4.6.7,
  happy-dom 21.0.3, @testing-library/react 16.3.3, @google/genai 2.30.0. Node 22.22.2 and
  Bun 1.3.14 are installed; Playwright Chromium builds already exist in `%LOCALAPPDATA%\ms-playwright`.
- Reuse instead of writing: `@axe-core/playwright` `AxeBuilder` (no custom axe injection),
  `ai-kit` `chat()` / `rateLimit()` / `ProviderBadge`, `Intl.NumberFormat` for currency, Next
  file conventions (`opengraph-image`, `not-found`, `proxy.ts`).
- Fonts from Fontsource packages (`@fontsource/atkinson-hyperlegible`,
  `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/jetbrains-mono`), copied as
  woff2 into `app/fonts/` with their OFL licenses, loaded with `next/font/local`.

## Slices

<a id="s0"></a>
### S0. Skeleton, routing, old flow served (milestone 1)

Goal: `bun run dev` serves `/en/app` and `/es/app` (placeholder content), redirects work,
`/broken/index.html` is the untouched old flow.

Tasks
1. Project files: `package.json` (scripts table in spec §2), `tsconfig.json` (strict,
   `noUncheckedIndexedAccess`, `checkJs` for `scripts/*.mjs`, `@/*` alias), `biome.json`
   (ignores), `bunfig.toml` (test preload `test/setup.ts` registering happy-dom),
   `next.config.ts`; `.gitignore` adds `public/broken/`, `coverage/`, `test-results/`,
   `playwright-report/`.
2. `scripts/copy-broken.ts`: copy every file of `broken/` to `public/broken/` byte for byte.
   Test first: copying into a temp dir yields identical SHA-256 per file.
3. `broken.sha256` + a test that `broken/` still matches it.
4. `lib/i18n/locales.ts` (`locales = ["en","es"] as const`, `isLocale`), `lib/i18n/dictionaries.ts`
   with the first keys (portfolio link text, language switch labels, page title).
5. `lib/routing.ts` `resolveRoute()` with a table-driven test covering every row of spec §3
   (query kept, `/fr` 404, `/broken/index.html` untouched, `/redesign` → `/en/redesign`).
6. `proxy.ts` calling `resolveRoute`; `app/[lang]/layout.tsx` (`<html lang>`,
   `generateStaticParams`, `dynamicParams = false`), `app/[lang]/page.tsx` redirecting to
   `app`, `app/[lang]/app/page.tsx` placeholder with the `← All projects` link and EN/ES
   switch, `app/not-found.tsx`.
7. Dictionary copy-rule test (no em dash, banned brand list).

Acceptance
- `bun install`, `build`, `typecheck`, `lint`, `test` pass.
- `/` → 307 `/en`; `/es?x=1` → `/es/app?x=1`; `/fr/app` → 404; `/broken/index.html` 200 with
  bytes equal to `broken/index.html`.

Commit: `feat: scaffold Next app with locale routing and served old flow`

<a id="s1"></a>
### S1. `measure` tracer bullet (milestone 2)

Goal: the graded number exists end to end, against a stub redesign page.

Tasks
1. `app/[lang]/redesign/page.tsx` stub: correct `lang`, title, one `h1`, landmark.
2. `refit.routes.json` with `["/en/redesign"]` for now (3 entries in S3).
3. `scripts/measure-lib.mjs` (tests first in `test/measure-lib.test.ts`):
   - `parseRoutes(json)`: requires `{ steps: string[] }`, non-empty, each starts with `/` and
     not `//`; throws a readable error otherwise.
   - `expandLocales(route, locales)`.
   - `aggregate(results[])` → `{ violations, nodes }`.
   - `countScreensInDocument(document)` per spec §6 step 7. Tests: `broken/index.html` parsed
     by happy-dom → 5; a page with no hidden groups → 1; a synthetic 4-screen page using a
     `.hidden` class → 4; a page whose only hidden sibling is a fixed overlay → 1.
   - `buildOutput(before, after, steps)` → the brief's exact keys.
4. `scripts/measure.mjs`: build (stdout → stderr), free port via `net.createServer().listen(0)`,
   `next start`, readiness poll (timeout 60 s), headless Chromium, axe per page, write
   `data/measure.json`, print JSON, kill the process tree in `finally`, exit 1 on error.
   `countScreens` runs in the page via `page.evaluate` using the same function.
5. `e2e/measure.e2e.ts`: spawns `node scripts/measure.mjs --no-build`, asserts stdout is one
   JSON document matching the zod schema and `before.violations > 0`.
6. `playwright.config.ts` (`testMatch: "**/*.e2e.ts"`, `webServer: next start` on a fixed port).

Acceptance
- `bun run measure > out.json` gives valid JSON with only the brief's keys; logs go to stderr.
- Two runs in a row give identical numbers.

Review: + `security-reviewer` (child processes, file writes, route validation).
Commit: `feat: add measure CLI with axe-core and screen counting`

<a id="s2"></a>
### S2. Identity (milestone 3)

Tasks
1. Tests first: `lib/design/contrast.ts` (`relativeLuminance`, `contrastRatio`) against known
   values (black/white = 21, `#777`/white ≈ 4.48); `test/tokens.test.ts` parses
   `app/tokens.css` and checks every pair in `lib/design/pairs.ts`.
2. `app/tokens.css` (spec §8 palette, spacing, radius, focus ring, type scale),
   `app/globals.css` (reset, `:focus-visible` ring, reduced motion, skip link), fonts in
   `app/fonts/` via `next/font/local` exposed as CSS variables.
3. `components/Wordmark.tsx` (SVG stitch underline, accessible name) and `app/icon.svg`.
4. `DESIGN.md`: palette with hex and roles, every text/background pair with its ratio and
   AA result, type scale, spacing, focus, motion, wordmark usage. A test asserts the table's
   ratios equal the computed ones.

Acceptance: contrast test green (text pairs ≥ 4.5, non-text ≥ 3); the `/en/app` placeholder
uses tokens and fonts; layout holds at 375 px.

Commit: `feat: add Refit identity tokens, fonts, wordmark and DESIGN.md`

<a id="s3"></a>
### S3. Redesigned flow (milestone 4, the graded slice)

Tasks (tests first for each)
1. `lib/pricing.ts`: plans `{ id: "free"|"pro"|"team", priceCents: 0|1900|4900, currency: "EUR" }`,
   `formatPrice(cents, locale)` (rejects non-integer cents; `es` → `19,00 €`, `en` → `€19.00`).
2. `lib/signup/validate.ts`: `validateAccount({ name, email, password })` → field error codes
   (`required`, `email-format`, `password-short`); trims name; messages come from the
   dictionary, not the validator.
3. `lib/flow/reducer.ts`: steps `account | plan | done`; actions `submitAccount`, `choosePlan`,
   `confirm`, `reset`; returns new objects (tests freeze the input). `lib/flow/storage.ts`:
   zod-validated `sessionStorage` read/write; bad data → initial state.
4. `lib/flow/step.ts`: `parseStep(searchParam)`; unknown → `account`.
5. Components (`components/flow/`): `SignupFlow` (client, `headingLevel` prop), `AccountStep`,
   `PlanStep`, `DoneStep`, `ErrorSummary`, `Field`, `PasswordField`, `StepProgress`. Component
   tests: every input has a label; Pro checked by default; submitting empty fields focuses the
   error summary and sets `aria-invalid`; plan and done render without state; one `h1`.
6. `app/[lang]/redesign/page.tsx` real page; `generateMetadata` per locale.
7. Dictionary keys for all flow copy in `en` and `es`.
8. `refit.routes.json` → the 3 steps of spec §5.
9. `e2e/keyboard.e2e.ts`, per locale: start at `/{lang}/redesign` and use only
   `keyboard.press` / `keyboard.type` (no clicks). Fill name, email and password, press Enter,
   Tab to the radio group (Pro already selected; arrow keys move the selection and back to
   Pro), Tab to "Create account", press Enter, assert the done heading shows the name and
   "Pro". Also assert a visible focus indicator on every focused element (computed outline
   width > 0).
10. `e2e/a11y.e2e.ts`: axe (WCAG tags **and** best-practice) on every expanded route → 0
    violations; at 375 px, `scrollWidth <= clientWidth` on each step.

Acceptance
- `bun run measure` → `after.violations == 0`, `steps.after == 3`, `steps.before == 5`.
- Keyboard e2e green in `en` and `es`.

Commit: `feat: build accessible 3-step redesigned signup flow`

<a id="s4"></a>
### S4. Audit, demo and live (milestone 5)

Tasks
1. `lib/audit/schema.ts` (zod) + `data/audit.json` written from the seed list in spec §7,
   each entry checked against the old page (the S1 `data/measure.json` details list the axe
   rule ids). Tests: the fixture parses; every old-page axe rule id is covered by some
   `axeRules`; every entry has both locales; no em dashes.
2. `components/audit/AuditList.tsx`: provenance label ("Written by me, the maintainer. Not
   model output."), entries grouped by severity, criterion chips linking to the W3C
   Understanding docs.
3. `lib/audit/live.ts`: `isLiveMode(env)` (pure, tested), `buildAuditPrompt(source)` (pure,
   tested: includes the three files, asks for JSON only), `parseModelAudit(text)` (pure,
   tested on good, fenced, malformed and oversized model output).
4. `app/api/audit/route.ts` (POST): 404 if not live; `rateLimit(ip, { maxRequests: 5 })`;
   read the fixed files with `fs/promises` from `process.cwd()`; call `chat()`; return the
   envelope; log errors server-side without secrets. Handler tests inject `chat` (no network):
   demo → 404, rate limited → 429, provider failure → 502 envelope.
5. `components/audit/LiveAudit.tsx` (client): the button appears only when the server page
   passes `live=true`; loading state with `aria-busy`; result labelled "Generated by a
   language model, not reviewed" + `ProviderBadge`; fallback notice on failure.

Review: + `security-reviewer` (env secrets, external calls, rate limit, output rendering).
Commit: `feat: add maintainer audit with optional live model audit`

<a id="s5"></a>
### S5. Story page, Compare, OG images (milestone 6)

Tasks
1. `lib/measure/read.ts`: load and zod-validate `data/measure.json` (the shape `measure`
   writes); a missing or invalid file fails the build with a clear message. Tests on fixtures.
2. `app/[lang]/app/page.tsx` sections in spec §9 order: `Hero`, `Analogy` (+ `<dl>` of 4
   terms), `TryIt` (titled iframe + new-tab link, embedded `SignupFlow headingLevel="h3"`,
   `AuditList`, `LiveAudit`), `Compare` (values from `read.ts`, deltas computed, timestamp
   and axe version shown), `WhereItFits`, `WhatItProves`, `ForEngineers` `<details>`.
3. Component test: section headings in the required order; exactly one `h1`; `<details>`
   closed by default; portfolio link href per locale; Compare shows the values of a fixture
   `measure.json` (proves nothing is hard-coded).
4. `app/[lang]/opengraph-image.tsx` (name + one-liner per locale, token colors) and
   `generateMetadata` with `alternates.languages`.
5. E2E: axe on `/{lang}/app` excluding the iframe → 0; 375 px without horizontal scroll; the
   language switch keeps the path.

Commit: `feat: add story page with measured Compare section and OG images`

<a id="s6"></a>
### S6. Receipts and docs (milestone 7)

Tasks
1. Run `bun run measure` on a clean build; commit `data/measure.json`.
2. `README.md` and `README.es.md`: graded number first (`axe violations X → 0`, read from
   `data/measure.json`, with the command to reproduce), how to run (all scripts, the Node 22
   note for Windows), architecture in under 10 lines, 2–3 tradeoffs (screen-counting
   heuristic vs scripted walkthrough; per-page violation sum; Pro preselected), and what
   didn't work (real failures met during S0–S5).
3. Definition-of-done pass: fresh `bun install`, then `build`, `test`, `typecheck`, `lint`,
   `measure`, `test:e2e`; `bun run dev` with an empty environment serves `/en/app` and
   `/es/app`; coverage ≥ 80 % on `lib/` and `measure-lib`.
4. Set the PRD milestone statuses to `complete`, with commit links.

Commit: `docs: add READMEs and committed measurement receipts`

## Dependency order

S0 → S1 → S2 → S3 → (S4 ∥ S5 after S3) → S6. S4 and S5 touch different files except the
`/app` page, which S5 owns; S4 only adds the components that S5 places.

## Risks watched during the build

| Risk | Detection | Response |
|---|---|---|
| `ai-kit` fails `tsc` strict or Biome | S4 typecheck | Biome ignores `ai-kit/`; import only the needed files; never edit; note it in the README |
| Next 16 + happy-dom + RTL friction with server components | S0/S3 tests | unit-test client and pure section components; cover server pages via e2e |
| axe `color-contrast` "incomplete" on gradients or overlays | S3 measure | flat backgrounds in the flow |
| `target-size` (2.5.8) on inline links | S3 a11y e2e | inline links in sentences are exempt; standalone controls ≥ 44 px |
| Windows cleanup leaves `next start` running | S1 | `taskkill /T /F` in `finally`; check the port is free afterwards |
| Screen counting miscounts hidden cases | S1 tests | synthetic fixtures; documented fallback of 1; algorithm explained in "For engineers" |
