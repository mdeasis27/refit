# Refit: a broken signup flow, audited and redesigned, with the receipts

Source brief: [`REQUIREMENTS.md`](../../REQUIREMENTS.md). This PRD restates it as product
requirements. Design and implementation live in [`docs/design/refit-spec.md`](../design/refit-spec.md)
and [`docs/plan/refit-slices.md`](../plan/refit-slices.md).

## Restatement

Refit takes a deliberately bad 3-step signup and plan-checkout flow (`broken/`, never edited),
documents what is wrong with it, rebuilds it as a short accessible flow, and proves the
improvement with numbers that the product measures itself (axe violations and screen count,
before and after).

## Framing (answered by the planner; no human available, see spec decisions D-P1..D-P4)

1. **Who** has this problem? People reviewing a front-end / accessibility portfolio (hiring
   managers, senior engineers) who want proof, not claims, that the author can find and fix
   accessibility and UX defects. Secondary: a product owner whose signup flow looks like
   `broken/` and is losing signups.
2. **Observable pain.** The old flow asks for 14 inputs plus a payment step and an email
   round trip to capture 4 facts (name, email, password, plan). It cannot be finished with
   the keyboard (div "buttons", mouse-only plan cards, a Tab-swallowing terms dialog), hides
   prices behind hover, forces a marketing opt-in, and fails automated WCAG checks.
3. **Why existing tools don't solve it.** An axe report lists rule ids but not what a fixed
   flow looks like; a redesign mockup shows a fix but no evidence. Nobody shows both, side
   by side, with numbers reproducible by one command.
4. **Why now.** WCAG 2.2 AA (target size, focus visibility, accessible authentication) is
   the current baseline, and the portfolio needs a project graded on a measured number.

## Problem

Reviewers cannot tell whether a portfolio author really knows accessibility and form UX,
because most portfolios show finished screens without the defects they fixed or a way to
verify the result. The cost: the claim "I build accessible flows" goes unproven.

## Evidence

- `broken/README.md` and `broken/index.html`: 11 text fields, 1 select, 2 required checkboxes
  in step 1; payment for every plan including Free; an inbox step that does nothing. The
  business needs only name, email, password and plan (`REQUIREMENTS.md` §1).
- Observed by reading the source: no `lang`, no `<title>`, no labels, `user-scalable=no`,
  `outline: none`, `#aaa` text on white, div buttons without role or `tabindex`, hover-only
  prices, a keydown handler that blocks Tab inside the terms dialog, an auto-advancing
  carousel with no pause.
- Size of the axe gap and the before/after screen count: **TBD, needs validation via the
  `measure` script** (first run in slice S1). No numbers are typed into this PRD.

## Users

- **Primary**: a technical reviewer opening `/{lang}/app`, with a few minutes, who wants to
  try both flows, read the defect list and see the numbers.
- **Secondary**: the maintainer/grader, who runs `bun run measure` and completes the
  redesign with the keyboard only.
- **Not for**: real signups. No backend, no accounts, no payments, no email.

## Hypothesis

We believe **a redesigned 3-screen flow asking only for the 4 required facts, plus an audit
mapping every old defect to a WCAG criterion or UX heuristic** will **prove accessibility and
form-UX skill** for **portfolio reviewers**.
We'll know we're right when **`measure` reports 0 axe violations after (every step, both
locales), fewer screens after than before, and the redesign can be completed end to end with
the keyboard only.**

## Success Metrics

| Metric | Target | How measured |
|---|---|---|
| axe violations after (WCAG 2.0/2.1/2.2 A+AA tags, no rule disabled, every route × both locales) | 0 | `bun run measure` → `after.violations` |
| axe violations before | reported as measured (expected > 0) | `bun run measure` → `before.violations` |
| Screens start → confirmation | after < before (expected 3 vs 5) | `measure` → `steps` |
| Keyboard-only completion | passes in `en` and `es` | Playwright keyboard e2e (`test:e2e`) |
| Inputs the user must fill | 3 text inputs + 1 plan choice (Pro preselected) | e2e assertion |
| Definition of done (REQUIREMENTS "Constants") | all 5 items | local verification run |

## Scope

**MVP**
- Old flow served unchanged at `/broken/index.html` (copied at build time).
- Redesigned flow at `/{lang}/redesign`: account details → plan and confirm → done; local
  state only; every step reachable by URL.
- Audit: committed, maintainer-written list of defects (criterion or heuristic, evidence,
  what the redesign does). Optional live LLM audit only when an API key env var is set,
  labelled as model output.
- Compare: numbers read from the output of the product's own `measure` script.
- Story page `/{lang}/app` with the fixed section order, "For engineers" details, EN/ES,
  portfolio link, OG image per locale.
- Its own identity (palette, type, wordmark) documented in `DESIGN.md` with contrast ratios.
- `README.md`, `README.es.md`.

**Out of scope**
- Real account creation, payment, email verification: the brief requires local state only.
- Auditing arbitrary URLs: adds SSRF and scope risk; the audit target is fixed.
- Manual screen-reader test reports: valuable but not reproducible by a script; listed as a
  limitation in the README.
- Locales beyond `en`/`es`.

## Delivery Milestones

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Skeleton and routing | `/en/app`, `/es/app` render; locale redirects; old flow served | complete | [S0](../plan/refit-slices.md#s0) |
| 2 | Measuring tracer | `bun run measure` prints valid JSON against a stub redesign | complete | [S1](../plan/refit-slices.md#s1) |
| 3 | Identity | tokens, fonts, wordmark, `DESIGN.md` with verified contrast | complete | [S2](../plan/refit-slices.md#s2) |
| 4 | Redesigned flow | flow works in both locales, keyboard only, 0 axe violations | complete | [S3](../plan/refit-slices.md#s3) |
| 5 | Audit | defect list visible, demo vs live provenance labelled | complete | [S4](../plan/refit-slices.md#s4) |
| 6 | Story page and Compare | full `/{lang}/app` with measured numbers and OG images | complete | [S5](../plan/refit-slices.md#s5) |
| 7 | Receipts and docs | final measure committed, READMEs, DoD verified | complete | [S6](../plan/refit-slices.md#s6) |

## Open Questions (resolved by recommendation, recorded in the spec's decision log)

- [x] What counts as a "violation"? → failed axe rules per page, summed over pages; `nodes` = failing nodes summed. (D-M2)
- [x] Does "both locales" mean `refit.routes.json` lists both? → No. It lists `en` steps; `measure` expands each to every locale for axe; `steps.after` counts the listed steps. (D-M3)
- [x] How is `steps.before` derived without typing it in? → counted from the old page's DOM (groups of sibling screens toggled by `hidden`), generically. (D-M4)
- [x] Is payment a step in the redesign? → No. The brief says the only facts needed are name, email, password and plan. (D-F1)
- [ ] Will the grader's hidden cases use a different old page or only different route lists? Unknown, so `measure` stays generic (no selectors specific to this page).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Playwright hangs under Bun on Windows | High (stated) | `measure` unusable | browser part is a Node 22 `.mjs` script |
| Build output pollutes `measure` stdout | Medium | invalid JSON | child stdout routed to stderr; a test parses stdout |
| Vendored `ai-kit/` fails strict typecheck or lint | Medium | DoD fails | lint ignores `ai-kit/`; never edit it; import only what is needed |
| `next/font/google` needs network at build | Medium | offline build fails | self-host fonts with `next/font/local` |
| Hidden cases differ from visible fixtures | Medium | wrong numbers | generic step counting, locale expansion, route validation |
| Later steps loaded directly have no state | High | broken page under axe | each step renders fully without state |

---
*Status: COMPLETE (all milestones built and verified). Implementation planning: see docs/plan/refit-slices.md.*
