// @ts-check
// `bun run measure`: builds and serves the app, runs axe-core (WCAG 2.2 AA tags) with Playwright
// on the old flow and on every redesign route, and prints one JSON document on stdout.
// Everything else (build logs, progress, errors) goes to stderr. Runs under Node 22, because
// Playwright's browser launch hangs under Bun on Windows.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import {
  aggregate,
  buildOutput,
  countScreensInDocument,
  expandAll,
  parseRoutes,
} from "./measure-lib.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OLD_FLOW = "/broken/index.html";
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const READY_TIMEOUT_MS = 90_000;
const NAVIGATION_TIMEOUT_MS = 30_000;

/** @param {string} message */
const log = (message) => process.stderr.write(`[measure] ${message}\n`);

/** @param {string[]} argv */
function parseArgs(argv) {
  const options = { build: true, routes: resolve(ROOT, "refit.routes.json"), write: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--no-build") options.build = false;
    else if (arg === "--no-write") options.write = false;
    else if (arg === "--routes") {
      i += 1;
      const value = argv[i];
      if (!value) throw new Error("--routes needs a file path");
      options.routes = resolve(process.cwd(), value);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function runBuild() {
  log("building (bun run build)");
  const result = spawnSync("bun", ["run", "build"], {
    cwd: ROOT,
    stdio: ["ignore", 2, 2],
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error(`build failed with exit code ${result.status}`);
}

/** @returns {Promise<number>} */
function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

/**
 * @param {number} port
 * @returns {import("node:child_process").ChildProcess}
 */
function startServer(port) {
  log(`serving on port ${port}`);
  const nextBin = resolve(ROOT, "node_modules", "next", "dist", "bin", "next");
  return spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: ROOT,
    stdio: ["ignore", 2, 2],
  });
}

/** @param {import("node:child_process").ChildProcess} child */
function stopServer(child) {
  if (child.pid === undefined || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      timeout: 15_000,
    });
  } else {
    child.kill("SIGTERM");
  }
}

/**
 * @param {string} origin
 * @param {import("node:child_process").ChildProcess} child
 */
async function waitUntilReady(origin, child) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("the server exited before it was ready");
    try {
      const response = await fetch(`${origin}${OLD_FLOW}`);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("the server did not become ready in time");
}

/**
 * @param {import("playwright").Browser} browser
 * @param {string} origin
 * @param {string} route
 */
async function analyze(browser, origin, route) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    if (!response?.ok()) {
      throw new Error(`${route} answered ${response ? response.status() : "nothing"}`);
    }
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    const rules = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length }));
    return { url: route, rules, axeVersion: results.testEngine.version };
  } finally {
    await context.close();
  }
}

/**
 * @param {import("playwright").Browser} browser
 * @param {string} origin
 */
async function countOldFlowScreens(browser, origin) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await context.newPage();
    await page.goto(`${origin}${OLD_FLOW}`, { waitUntil: "networkidle" });
    return await page.evaluate(({ source }) => new Function(`return (${source})`)()(document), {
      source: countScreensInDocument.toString(),
    });
  } finally {
    await context.close();
  }
}

/**
 * Launches Chromium. If the build this Playwright version wants is not installed, falls back to
 * the newest Chromium found in the Playwright browsers folder instead of failing.
 */
async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const fallback = findInstalledChromium();
    if (!fallback) throw error;
    log(`default Chromium missing, using ${fallback}`);
    return await chromium.launch({ headless: true, executablePath: fallback });
  }
}

/** @returns {string | undefined} */
function findInstalledChromium() {
  const base =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    (process.platform === "win32"
      ? resolve(process.env.LOCALAPPDATA ?? resolve(homedir(), "AppData", "Local"), "ms-playwright")
      : process.platform === "darwin"
        ? resolve(homedir(), "Library", "Caches", "ms-playwright")
        : resolve(homedir(), ".cache", "ms-playwright"));
  if (!existsSync(base)) return undefined;
  /** @type {Record<string, string[]>} */
  const layouts = {
    win32: ["chrome-win64", "chrome.exe"],
    darwin: ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"],
    linux: ["chrome-linux", "chrome"],
  };
  const relative = layouts[process.platform];
  if (!relative) return undefined;
  /** @param {string} name */
  const revision = (name) => Number(name.split("-").pop());
  const candidates = readdirSync(base)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => revision(b) - revision(a))
    .map((name) => resolve(base, name, ...relative))
    .filter((path) => existsSync(path));
  return candidates[0];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const stepRoutes = parseRoutes(JSON.parse(readFileSync(options.routes, "utf8")));
  const afterRoutes = expandAll(stepRoutes);

  if (options.build) runBuild();
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = startServer(port);
  try {
    await waitUntilReady(origin, server);
    const browser = await launchBrowser();
    try {
      log(`measuring ${OLD_FLOW}`);
      const beforePage = await analyze(browser, origin, OLD_FLOW);
      /** @type {Awaited<ReturnType<typeof analyze>>[]} */
      const afterPages = [];
      for (const route of afterRoutes) {
        log(`measuring ${route}`);
        afterPages.push(await analyze(browser, origin, route));
      }
      const screensBefore = await countOldFlowScreens(browser, origin);
      const output = buildOutput(aggregate([beforePage]), aggregate(afterPages), {
        before: screensBefore,
        after: stepRoutes.length,
      });
      if (options.write) {
        const details = {
          ...output,
          measuredAt: new Date().toISOString(),
          axeVersion: beforePage.axeVersion,
          tags: AXE_TAGS,
          routes: { steps: stepRoutes, measured: afterRoutes },
          pages: { before: [beforePage], after: afterPages },
        };
        try {
          writeFileSync(
            resolve(ROOT, "data", "measure.json"),
            `${JSON.stringify(details, null, 2)}\n`,
          );
        } catch (error) {
          // The numbers on stdout are the result; the file only feeds the page.
          log(
            `could not write data/measure.json: ${error instanceof Error ? error.message : error}`,
          );
        }
      }
      process.stdout.write(`${JSON.stringify(output)}\n`);
    } finally {
      await browser.close();
    }
  } finally {
    stopServer(server);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    log(`failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  },
);
