# Refit: a broken signup flow, audited and redesigned, with the receipts

Slug: `refit`. `broken/` holds a deliberately bad 3-step signup and plan-checkout flow
(static HTML, CSS and JS). Do not edit anything in `broken/`. Refit audits it, redesigns it,
and shows before and after side by side with measured numbers.

## 1. The task the flow exists for

Create an account with name, email and password, choose the Pro plan, and confirm. Those are
the only facts the business needs. `broken/README.md` lists what the old flow asks for.

## 2. Product

- **Before:** `broken/` served as-is at `/broken/index.html` (copy it to `public/broken/`
  at build time, unchanged).
- **After:** the redesigned flow at `/{lang}/redesign`, fully working in the browser with
  local state only (no backend, no real account). Its own identity, as the constants say.
- **Audit:** a list of the problems found in the old flow, each with the WCAG criterion or
  UX heuristic it breaks and what the redesign does about it. An LLM audit through
  `ai-kit/` runs only in live mode; demo mode shows the committed audit, labelled as
  written by the maintainer, never as model output.
- **Compare:** numbers measured by the product's own `measure` script (below), not typed in.

## 3. CLI scripts

| Script | Must do |
|---|---|
| `measure` | Builds and serves the app, runs axe-core (all rules, WCAG 2.2 AA tags) with Playwright on `/broken/index.html` and on every route in `refit.routes.json`, and prints `{ "before": { "violations", "nodes" }, "after": { "violations", "nodes" }, "steps": { "before", "after" } }`. |

Environment note (Windows): Playwright's browser launch hangs under the Bun runtime; run
the browser part of `measure` with Node 22 (installed), e.g. a `.mjs` script started from the
`measure` package script.

`refit.routes.json` (committed by you): `{ "steps": ["/en/redesign", ...] }`, the URLs or
URL states of each step of the redesigned flow, in order. `steps.before` and `steps.after`
count screens from start to confirmation.

## 4. Graded number

The maintainer re-runs axe on `/broken/` and on each route in `refit.routes.json` (both
locales), and also completes the task end to end on the redesign with the keyboard only.
The number: **axe violations before → after**, with the after count only valid if the task
can be completed with the keyboard.

## Constants (identical in every tanda 1 brief)

### Stack (fixed)
- Bun as package manager and runtime. Next.js App Router. TypeScript strict, no `any`, no
  `@ts-ignore`. Tests with `bun test`. Linter of your choice.
- Money is integer cents, never floats.
- Required scripts: `dev`, `build`, `test`, `typecheck` (`tsc --noEmit`), `lint`, plus the
  project-specific CLI scripts in its brief. CLI scripts print JSON on stdout and nothing else.

### Demo mode (portfolio rule)
- The app must work fully with **no environment variables**: every external service (LLM,
  email, payments, analytics) has a demo path that uses committed fixtures.
- Optional live mode only when its env var is set. Never required for the page, the tests
  or the CLI scripts.
- If this project uses an LLM, `ai-kit/` (already in the repo, treat it as vendored) is
  the client: its `chat()` router (`ai-kit/router.ts`) falls back across free providers and
  is live when any of `GEMINI_API_KEY`, `GROQ_API_KEY` or `OPENROUTER_API_KEY` is set;
  `demo-mode.ts` has the demo helpers. Read the code, not only its README.

### Routes and portfolio integration
- Locales `en` (default) and `es`. Every visible string exists in both, from one typed
  dictionary (`Record<"en" | "es", …>`) so a missing translation is a type error.
- `/` and any path without a locale redirect to `/en…`, keeping the query string. An
  unknown locale returns 404. `/{lang}` redirects to `/{lang}/app`.
- `/{lang}/app` is the product page. At its top-left, a link
  `https://portafolio-mdea.vercel.app/{lang}/projects` reading `← All projects` /
  `← Todos los proyectos`. A language switch EN/ES.
- `/{lang}/app` is a story page, sections in this order: hero (name, one-liner, chips);
  an analogy paragraph with a 3–5 term mini-glossary; "Try it" (the working product);
  "Compare" (real numbers computed by the product, never hard-coded); "Where it fits"
  (worth it when / not needed when); "What it proves" (first person).
- Last, a native collapsed `<details>` titled "For engineers" / "Para
  ingenieros": the mechanism (algorithm, thresholds), how it is tested, a `Stack: …` line,
  and a link to `https://github.com/mdeasis27/<slug>`.
- `opengraph-image` (Next file convention) per locale with the product name and one-liner.
- Copy rules: first person, plain words, no em dashes, no brand or company names in UI copy.

### Identity (its own, not a shared design system)
- Its own palette, typography (Google Fonts via `next/font` or self-hosted) and a wordmark.
  Defined as CSS tokens in this repo and documented in `DESIGN.md` at the root, with the
  contrast ratio of each text/background pair (WCAG AA minimum).
- Works at 375 px wide. Keyboard accessible, visible focus, labelled controls, one `h1`.

### Docs
- `README.md` (EN) and `README.es.md` (ES), result first: the graded number at the top,
  how to run, architecture in under 10 lines, 2–3 tradeoffs, what didn't work.

### Definition of done
1. `bun install`, `build`, `test`, `typecheck` and `lint` all pass.
2. Every CLI script in the brief runs on the committed fixtures and prints valid JSON.
3. `bun run dev` serves `/en/app` and `/es/app`, working with no environment variables.
4. `README.md`, `README.es.md` and `DESIGN.md` exist as described.
5. Everything is committed to git in this repository.

The grader also runs the CLI scripts against **hidden cases** in the same format. Make the
logic general; don't fit it to the visible fixtures.
