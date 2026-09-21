import { defineConfig, devices } from "@playwright/test";

/**
 * The browser tests.
 *
 * Vitest covers the converter, which is pure and needs no browser. These
 * tests cover what a visitor touches: the page, the buttons, and above all
 * the clipboard, which is the whole point of the site and which no unit test
 * can reach.
 *
 * They drive the built site, not the development server, because the built
 * site is what a visitor gets. A base path that only exists in production
 * is a defect that only the build can show.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,

  // A flaky pass is worse than a failure, because it teaches people to press
  // the button again. Failing once is the report.
  retries: 0,
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: "http://127.0.0.1:4173/markdown-to-wattpad/",
    trace: "retain-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Many writers draft on a phone, so the phone is not an afterthought.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  // A plain static server that behaves like GitHub Pages: a dumb file host
  // under a path prefix.
  webServer: {
    command: "node scripts/serve-dist.mjs 4173",
    url: "http://127.0.0.1:4173/markdown-to-wattpad/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
