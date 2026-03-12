/**
 * Shared constants and helpers for Demoblaze API tests.
 *
 * Mirrors the pattern from the automation_playwright_ts project's
 * tests/api/helpers.ts — loads config from test_data/test-data.json
 * and resolves $ENV_VAR references at runtime.
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

export interface PerfThresholds {
  page_load_ms: number;
  api_response_ms: number;
  cart_update_ms: number;
}

export interface ApiConfig {
  base_url: string;
  timeout_ms: number;
  perf_thresholds: PerfThresholds;
}

export interface ProductConfig {
  name: string;
  category: string;
  price: number;
}

export interface InvalidLoginAttempt {
  id: string;
  username: string;
  password: string;
  expected_message: string;
}

export interface TestData {
  api: ApiConfig;
  users: {
    existing: { username: string; password: string };
    invalid: { username: string; password: string };
  };
  products: {
    phone: ProductConfig;
    laptop: ProductConfig;
    monitor: ProductConfig;
  };
  checkout: {
    valid: {
      name: string;
      country: string;
      city: string;
      card: string;
      month: string;
      year: string;
    };
  };
  signup: {
    duplicate_error: string;
    success_message: string;
    empty_field_error: string;
  };
  login: {
    wrong_password_error: string;
    no_user_error: string;
  };
  invalid_login_attempts: InvalidLoginAttempt[];
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

export function loadTestData(): TestData {
  const filePath = path.resolve(__dirname, "../../test_data/test-data.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TestData;
}

export function loadApiConfig(): ApiConfig {
  return loadTestData().api;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const cfg = loadApiConfig();
export const API_BASE_URL = cfg.base_url;
export const API_TIMEOUT = cfg.timeout_ms;
export const PERF = cfg.perf_thresholds;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * If a string starts with "$", resolve it from process.env.
 * Returns the raw string otherwise.
 */
export function resolveEnv(value: string): string {
  if (value.startsWith("$")) {
    return process.env[value.slice(1)] ?? value;
  }
  return value;
}

/**
 * Generate a unique username using a timestamp + random suffix.
 * Safe to use in parallel test runs.
 */
export function uniqueUsername(prefix = "user"): string {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 9_999)}`;
  return `${prefix}_${suffix}`;
}

/**
 * Return the resolved existing-user credentials from env / test data.
 */
export function getTestUser(): { username: string; password: string } {
  const data = loadTestData();
  return {
    username: resolveEnv(data.users.existing.username),
    password: resolveEnv(data.users.existing.password),
  };
}

/**
 * Return resolved checkout form data from env / test data.
 */
export function getCheckoutData(): TestData["checkout"]["valid"] {
  const raw = loadTestData().checkout.valid;
  return {
    name: resolveEnv(raw.name),
    country: resolveEnv(raw.country),
    city: resolveEnv(raw.city),
    card: resolveEnv(raw.card),
    month: resolveEnv(raw.month),
    year: resolveEnv(raw.year),
  };
}
