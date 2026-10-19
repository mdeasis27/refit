// @ts-check
// Pure helpers for the `measure` script. No browser, no network: unit-tested with bun test.

/** @typedef {{ violations: number, nodes: number }} Totals */
/** @typedef {{ url: string, rules: Array<{ id: string, nodes: number }> }} PageResult */

export const LOCALES = /** @type {const} */ (["en", "es"]);

/**
 * Validates the routes file content and returns the list of step routes.
 * @param {unknown} json
 * @returns {string[]}
 */
export function parseRoutes(json) {
  if (typeof json !== "object" || json === null || !("steps" in json)) {
    throw new Error('Routes file must be an object like { "steps": ["/en/redesign"] }');
  }
  const steps = /** @type {{ steps: unknown }} */ (json).steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('"steps" must be a non-empty array of routes');
  }
  return steps.map((entry, index) => normalizeRoute(entry, index));
}

/**
 * Accepts a same-site path ("/en/redesign?step=plan") or an absolute http(s) URL, whose origin is
 * dropped: every route is always measured on the server this script starts itself.
 * @param {unknown} entry
 * @param {number} index
 * @returns {string}
 */
export function normalizeRoute(entry, index) {
  if (typeof entry !== "string" || entry.trim() === "") {
    throw new Error(`steps[${index}] must be a non-empty string`);
  }
  const value = entry.trim();
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    return `${url.pathname}${url.search}${url.hash}`;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    throw new Error(`steps[${index}] must be a path starting with a single "/": ${value}`);
  }
  return value;
}

/**
 * A route that starts with a supported locale is measured in every locale; others as given.
 * @param {string} route
 * @param {readonly string[]} [locales]
 * @returns {string[]}
 */
export function expandLocales(route, locales = LOCALES) {
  const match = /^\/([A-Za-z-]+)(?=\/|\?|#|$)([\s\S]*)$/.exec(route);
  if (!match || !locales.includes(/** @type {string} */ (match[1]))) return [route];
  return locales.map((locale) => `/${locale}${match[2] ?? ""}`);
}

/**
 * Expands every route and removes duplicates, keeping the first occurrence.
 * @param {readonly string[]} routes
 * @param {readonly string[]} [locales]
 * @returns {string[]}
 */
export function expandAll(routes, locales = LOCALES) {
  return [...new Set(routes.flatMap((route) => expandLocales(route, locales)))];
}

/**
 * violations = failed rules per page, summed. nodes = failing nodes per rule, summed.
 * @param {readonly PageResult[]} pages
 * @returns {Totals}
 */
export function aggregate(pages) {
  let violations = 0;
  let nodes = 0;
  for (const page of pages) {
    violations += page.rules.length;
    for (const rule of page.rules) nodes += rule.nodes;
  }
  return { violations, nodes };
}

/**
 * The exact shape the brief asks for, in the brief's key order.
 * @param {Totals} before
 * @param {Totals} after
 * @param {{ before: number, after: number }} steps
 */
export function buildOutput(before, after, steps) {
  return {
    before: { violations: before.violations, nodes: before.nodes },
    after: { violations: after.violations, nodes: after.nodes },
    steps: { before: steps.before, after: steps.after },
  };
}

/**
 * Counts the screens of a flow inside a document: the largest group of sibling blocks where
 * exactly one is shown at a time and the others are hidden, counting only blocks that are hidden or
 * hold a control. That is how a stepper shows one screen at a time. Carousels (no controls),
 * overlays and ordinary page sections (several visible) do not qualify. No group means 1.
 *
 * Self-contained on purpose: the measure script serializes this function into the page.
 * @param {Document} doc
 * @returns {number}
 */
export function countScreensInDocument(doc) {
  const view = doc.defaultView;
  const CONTROLS =
    "input, select, textarea, button, a[href], [role='button'], [onclick], [tabindex]";
  const IGNORED = new Set([
    "SCRIPT",
    "STYLE",
    "TEMPLATE",
    "LINK",
    "META",
    "NOSCRIPT",
    "OPTION",
    "HEAD",
    "TITLE",
  ]);

  /** @param {Element} el */
  const isHidden = (el) => {
    if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return true;
    const style = view?.getComputedStyle(el);
    return style?.display === "none" || style?.visibility === "hidden";
  };
  /** @param {Element} el */
  const isOverlay = (el) => {
    const style = view?.getComputedStyle(el);
    return style?.position === "fixed" || el.getAttribute("aria-modal") === "true";
  };

  let best = 1;
  for (const parent of Array.from(doc.querySelectorAll("*"))) {
    /** @type {Map<string, Element[]>} */
    const groups = new Map();
    for (const child of Array.from(parent.children)) {
      if (IGNORED.has(child.tagName) || isOverlay(child)) continue;
      groups.set(child.tagName, [...(groups.get(child.tagName) ?? []), child]);
    }
    for (const siblings of groups.values()) {
      // A screen is a hidden block, or a visible block that holds a control. Plain visible
      // blocks (a step bar, a banner) are page furniture, not screens.
      const screens = siblings.filter((el) => isHidden(el) || el.querySelector(CONTROLS) !== null);
      const hidden = screens.filter(isHidden).length;
      if (screens.length - hidden === 1 && hidden >= 1) best = Math.max(best, screens.length);
    }
  }
  return best;
}
