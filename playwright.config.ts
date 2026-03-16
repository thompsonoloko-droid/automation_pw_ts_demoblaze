import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * Playwright configuration for the Demoblaze test suite.
 *
 * Site:   https://www.demoblaze.com
 * API:    https://api.demoblaze.com
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  timeout: 90_000, // Increased from 60s to handle slow networks
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // Increased to 3 for CI, 1 for local (more flaky E2E tests)
  workers: process.env.CI ? 4 : undefined,

  reporter: [["list"], ["html", { open: "never", outputFolder: "reports/html" }]],

  use: {
    baseURL: "https://www.demoblaze.com",
    screenshot: "only-on-failure",
    video: "off",
    trace: "retain-on-failure",
    actionTimeout: 15_000, // Increased from 10s
    navigationTimeout: 20_000, // Increased from 15s
  },

  projects: [
    // --- Desktop browsers ---
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // --- Mobile emulation ---
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
