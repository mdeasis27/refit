type PlanCopy = { name: string; blurb: string };

export type Dictionary = {
  meta: {
    siteName: string;
    appTitle: string;
    appDescription: string;
    oneLiner: string;
    ogTagline: string;
    redesignTitles: { account: string; plan: string; done: string };
  };
  nav: {
    back: string;
    skip: string;
    langLabel: string;
    langNames: { en: string; es: string };
    wordmarkLabel: string;
  };
  hero: { chips: readonly string[] };
  analogy: {
    title: string;
    body: string;
    glossaryTitle: string;
    terms: readonly { term: string; definition: string }[];
  };
  tryIt: {
    title: string;
    intro: string;
    beforeTitle: string;
    beforeNote: string;
    beforeFrameTitle: string;
    openBefore: string;
    afterTitle: string;
    afterNote: string;
    openAfter: string;
  };
  audit: {
    title: string;
    intro: string;
    provenanceDemo: string;
    provenanceLive: string;
    breaksLabel: string;
    fixLabel: string;
    whereLabel: string;
    severity: { blocker: string; major: string; minor: string };
    kinds: { wcag: string; heuristic: string };
    runButton: string;
    running: string;
    failed: string;
    liveAvailable: string;
    modelBadgeLabel: string;
  };
  compare: {
    title: string;
    intro: string;
    caption: string;
    before: string;
    after: string;
    metric: string;
    violations: string;
    nodes: string;
    screens: string;
    measuredOn: string;
    reproduce: string;
    fewer: string;
  };
  fits: {
    title: string;
    worthTitle: string;
    worth: readonly string[];
    notTitle: string;
    not: readonly string[];
  };
  proves: { title: string; paragraphs: readonly string[] };
  engineers: {
    summary: string;
    mechanismTitle: string;
    mechanism: readonly string[];
    testingTitle: string;
    testing: readonly string[];
    stackLine: string;
    sourceLink: string;
  };
  flow: {
    progress: string;
    stepNames: { account: string; plan: string; done: string };
    demoNote: string;
    account: {
      title: string;
      intro: string;
      nameLabel: string;
      emailLabel: string;
      passwordLabel: string;
      passwordHint: string;
      showPassword: string;
      hidePassword: string;
      submit: string;
    };
    errors: {
      summaryTitle: string;
      summaryIntro: string;
      nameRequired: string;
      emailRequired: string;
      emailFormat: string;
      passwordRequired: string;
      passwordShort: string;
      detailsMissing: string;
    };
    plan: {
      title: string;
      legend: string;
      perMonth: string;
      free: PlanCopy;
      pro: PlanCopy;
      team: PlanCopy;
      summaryTitle: string;
      summaryName: string;
      summaryEmail: string;
      notEntered: string;
      edit: string;
      termsToggle: string;
      termsBody: string;
      consent: string;
      submit: string;
    };
    done: {
      title: string;
      message: string;
      again: string;
      emptyTitle: string;
      emptyBody: string;
      start: string;
    };
  };
  notFound: { title: string; body: string; home: string };
};
