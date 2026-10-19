import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3217);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  reporter: [["list"]],
  timeout: 90_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${port} -H 127.0.0.1`,
    url: `http://127.0.0.1:${port}/broken/index.html`,
    reuseExistingServer: false,
    // Demo mode: the tests must not pick up provider keys from the machine they run on.
    env: { GEMINI_API_KEY: "", GROQ_API_KEY: "", OPENROUTER_API_KEY: "" },
    timeout: 120_000,
  },
});
