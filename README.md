# Refit

I took a deliberately bad signup flow, found what was wrong with it, rebuilt it, and made a script measure the difference.

**axe violations: 9 → 0.** Elements affected: 15 → 0. Screens to finish: 5 → 3.

Measured with axe-core 4.14.0, all rules, the WCAG 2.0, 2.1 and 2.2 A and AA tags, on the old flow and on every step of the redesign in English and Spanish. The after count is only valid because the whole task, from the first field to the confirmation, can be finished with the keyboard alone. A browser test does that in both languages.

Reproduce it: `bun run measure`. It prints one JSON line on stdout and also writes the details (rules, nodes, versions, date) to `data/measure.json`, which the page reads for its Compare section.

Spanish version: [README.es.md](README.es.md).

## How to run

Needs Bun 1.3 and Node 22 (Playwright runs under Node, see below).

```bash
bun install
bun run dev        # http://localhost:3000/en/app and /es/app, no environment variables needed
bun run build
bun run test       # unit and component tests
bun run typecheck
bun run lint
bun run measure    # builds, serves, runs axe, prints the JSON
bun run test:e2e   # builds, then keyboard, axe, routing and 375 px browser tests
```

Optional live mode: set `GEMINI_API_KEY`, `GROQ_API_KEY` or `OPENROUTER_API_KEY` and the page shows a button that asks a model to audit the old flow. Without a key nothing changes: the page shows my committed audit, labelled as written by me. `SITE_URL` sets the base for social images.

## Pages

| Route | What it is |
|---|---|
| `/{en,es}/app` | The story page: idea, try both flows, the audit, the measured numbers |
| `/{en,es}/redesign` | The redesigned flow on its own, `?step=account\|plan\|done` |
| `/broken/index.html` | The old flow, copied unchanged at build time |

## Architecture

- `broken/` is never edited. `scripts/copy-broken.ts` copies it to `public/broken/` before dev and build, and a test checks the copy byte for byte and the source against a committed hash.
- Next.js App Router. `proxy.ts` calls `lib/routing.ts`, a pure table for redirects and 404s.
- One typed dictionary, `Record<"en" | "es", Dictionary>`, holds every visible string.
- The flow is a reducer (`lib/flow`) with local state only, kept in `sessionStorage` and checked with zod. The password is never stored.
- `scripts/measure.mjs` (Node) builds, starts the app on a free port, runs axe with Playwright, and prints JSON. Its pure parts live in `scripts/measure-lib.mjs` and are unit tested.
- The audit is data (`data/audit.json`, both languages, each entry tied to a WCAG criterion or heuristic). The live audit goes through the vendored `ai-kit/` router in `app/api/audit`.
- Identity tokens are in `app/tokens.css` and documented, with contrast ratios, in `DESIGN.md`.

## Tradeoffs

- **Counting screens without typing the number.** `steps.before` is found in the old page: the largest group of sibling blocks where exactly one is shown and the others are hidden, counting only blocks that are hidden or hold a control. A scripted walkthrough would be exact but only for this page. The heuristic works on other pages shaped like a stepper and falls back to 1 when it finds nothing.
- **Violations are summed per page.** If a rule fails on three pages it counts three. That is what re-running axe on each route gives, and it keeps the number honest when a step regresses.
- **Pro is preselected.** The task is to choose Pro, so it is already chosen, and Free and Team stay one arrow key away. It saves a step without hiding the choice.

## What didn't work

- My first screen-count rule asked for exactly one visible sibling. The old flow has a step bar next to its steps, so it counted 1. Now plain visible blocks without controls are ignored.
- The Playwright build that matches the installed version was not on this machine. `measure` now falls back to the newest Chromium it finds, and I also installed the matching one.
- `ai-kit/` does not pass strict TypeScript (`noUncheckedIndexedAccess`) in two files I do not use. I did not edit it. It is excluded from `tsc` and from the linter, and I import only the router, the rate limiter and the types.
- The first version of the keyboard test failed because Next adds its own `role="alert"` announcer, so I scoped the test to the error summary.
- I did not test with a screen reader. Automated checks find about a third of real problems at best; this repo proves the ones a machine can see, plus keyboard completion.
