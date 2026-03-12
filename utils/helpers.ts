/**
 * Test helpers and utility functions
 *
 * Shared functions used across test suites for common tasks:
 * - Logging
 * - Waiting with retry logic
 * - Data generation
 * - Report formatting
 */

import { type Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────
// Logging utilities
// ─────────────────────────────────────────────────────────────────────────

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function logDebug(message: string, data?: unknown): void {
  log(LogLevel.DEBUG, message, data);
}

export function logInfo(message: string, data?: unknown): void {
  log(LogLevel.INFO, message, data);
}

export function logWarn(message: string, data?: unknown): void {
  log(LogLevel.WARN, message, data);
}

export function logError(message: string, error?: Error | unknown): void {
  log(LogLevel.ERROR, message, error instanceof Error ? error.message : error);
}

// ─────────────────────────────────────────────────────────────────────────
// Wait and retry utilities
// ─────────────────────────────────────────────────────────────────────────

/**
 * Retry a function with exponential backoff.
 *
 * @param fn - Async function to retry
 * @param maxAttempts - Max retry attempts
 * @param baseDelayMs - Base delay between retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 100,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);

      if (attempt < maxAttempts) {
        logWarn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Wait for a condition to be true, with polling.
 *
 * @param condition - Function that returns true when condition met
 * @param timeoutMs - Max wait time
 * @param pollIntervalMs - How often to check condition
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs: number = 10_000,
  pollIntervalMs: number = 500,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

// ─────────────────────────────────────────────────────────────────────────
// Data generation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Generate random alphanumeric string.
 */
export function randomString(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate unique email for testing.
 */
export function generateTestEmail(): string {
  return `test_${randomString(8)}@example.com`;
}

/**
 * Generate unique username for testing.
 */
export function generateTestUsername(): string {
  return `testuser_${randomString(8)}`;
}

/**
 * Generate random password with requirements.
 */
export function generateTestPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*";

  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining with random chars
  const all = upper + lower + digits + special;
  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password;
}

// ─────────────────────────────────────────────────────────────────────────
// Page utilities
// ─────────────────────────────────────────────────────────────────────────

/**
 * Take screenshot with timestamp and test name.
 */
export async function takeScreenshot(
  page: Page,
  testName: string,
  screenshotDir: string = "./reports/screenshots",
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
  const filename = `${screenshotDir}/${testName}_${timestamp}.png`;

  await page.screenshot({ path: filename, fullPage: true });
  logInfo(`Screenshot saved: ${filename}`);

  return filename;
}

/**
 * Get page HTML content for analysis.
 */
export async function getPageHTML(page: Page): Promise<string> {
  return page.content();
}

/**
 * Check if element is visible on page.
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    return await page.locator(selector).isVisible({ timeout: 1_000 });
  } catch {
    return false;
  }
}

/**
 * Get all text content from page.
 */
export async function getPageText(page: Page): Promise<string> {
  const text = await page.textContent("body");
  return text || "";
}

// ─────────────────────────────────────────────────────────────────────────
// Assertion helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Assert page has no JavaScript errors.
 */
export async function assertNoJSErrors(page: Page): Promise<void> {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    errors.push(err.toString());
  });

  if (errors.length > 0) {
    throw new Error(`JavaScript errors found:\n${errors.join("\n")}`);
  }
}

/**
 * Assert response status is successful (200-299).
 */
export function assertSuccessStatus(status: number): void {
  if (status < 200 || status > 299) {
    throw new Error(`Expected success status (200-299), got ${status}`);
  }
}

/**
 * Assert value is within tolerance.
 */
export function assertWithinTolerance(
  actual: number,
  expected: number,
  tolerancePercent: number = 10,
): void {
  const tolerance = (expected * tolerancePercent) / 100;
  const min = expected - tolerance;
  const max = expected + tolerance;

  if (actual < min || actual > max) {
    throw new Error(
      `Value ${actual} outside tolerance ${tolerancePercent}% of ${expected} (expected ${min}-${max})`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Format utilities
// ─────────────────────────────────────────────────────────────────────────

/**
 * Format milliseconds to human-readable duration.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(2);

  return `${minutes}m ${seconds}s`;
}

/**
 * Format bytes to human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format table for console output.
 */
export function formatTable(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const value = row[h];
      return typeof value === "number" ? value.toFixed(2) : String(value || "-");
    }),
  );

  // Calculate column widths
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));

  // Format header
  let table = headers.map((h, i) => h.padEnd(widths[i])).join(" | ");
  table += "\n";
  table += widths.map((w) => "-".repeat(w)).join("-+-");
  table += "\n";

  // Format rows
  table += rows.map((r) => r.map((cell, i) => cell.padEnd(widths[i])).join(" | ")).join("\n");

  return table;
}
