export type ContrastPair = {
  /** Token name of the foreground (text, icon or border). */
  foreground: string;
  /** Token name of the background. */
  background: string;
  use: string;
  /** Minimum ratio: 4.5 for text, 3 for non-text (WCAG 1.4.11). */
  minimum: 4.5 | 3;
};

export const contrastPairs: readonly ContrastPair[] = [
  { foreground: "ink", background: "paper", use: "Body text on the page", minimum: 4.5 },
  { foreground: "ink", background: "chalk", use: "Body text on cards and fields", minimum: 4.5 },
  { foreground: "muted", background: "paper", use: "Secondary text on the page", minimum: 4.5 },
  { foreground: "muted", background: "chalk", use: "Hints and notes on cards", minimum: 4.5 },
  {
    foreground: "thread",
    background: "paper",
    use: "Links and accent text on the page",
    minimum: 4.5,
  },
  {
    foreground: "thread",
    background: "chalk",
    use: "Links and accent text on cards",
    minimum: 4.5,
  },
  { foreground: "chalk", background: "thread-strong", use: "Primary button label", minimum: 4.5 },
  { foreground: "chalk", background: "ink", use: "Text on dark blocks", minimum: 4.5 },
  { foreground: "seam", background: "paper", use: "Success text on the page", minimum: 4.5 },
  { foreground: "seam", background: "chalk", use: "Success text on cards", minimum: 4.5 },
  { foreground: "error", background: "paper", use: "Error text on the page", minimum: 4.5 },
  { foreground: "error", background: "chalk", use: "Error text on cards and fields", minimum: 4.5 },
  { foreground: "focus", background: "paper", use: "Focus ring against the page", minimum: 3 },
  { foreground: "focus", background: "chalk", use: "Focus ring against cards", minimum: 3 },
  { foreground: "line", background: "chalk", use: "Field and card borders", minimum: 3 },
  { foreground: "line", background: "paper", use: "Field borders on the page", minimum: 3 },
];
