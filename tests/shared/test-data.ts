/**
 * Centralized test data and environment resolution.
 *
 * Eliminates duplication across test files by providing a single,
 * reusable loader for test-data.json with environment variable resolution.
 *
 * Usage:
 *   import { testData, resolveEnv } from '../shared/test-data';
 *   const user = { username: resolveEnv(testData.users.existing.username), ... };
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface UserConfig {
  username: string;
  password: string;
}

export interface ProductConfig {
  name: string;
  category: string;
  price: number;
}

export interface CheckoutConfig {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

export interface TestDataType {
  api: {
    base_url: string;
    timeout_ms: number;
    perf_thresholds: {
      page_load_ms: number;
      api_response_ms: number;
      cart_update_ms: number;
    };
  };
  users: {
    existing: UserConfig;
    invalid: UserConfig;
  };
  products: {
    phone: ProductConfig;
    laptop: ProductConfig;
    monitor: ProductConfig;
  };
  checkout: {
    valid: CheckoutConfig;
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
  invalid_login_attempts: Array<{
    id: string;
    username: string;
    password: string;
    expected_message: string;
  }>;
  api_endpoints: Array<{
    name: string;
    path: string;
    method: string;
    body?: Record<string, unknown>;
  }>;
}

// ---------------------------------------------------------------------------
// Loader and resolver functions
// ---------------------------------------------------------------------------

/**
 * Load test data from test_data/test-data.json.
 *
 * @returns Parsed test data object
 * @throws Error if file not found or invalid JSON
 */
export function loadTestData(): TestDataType {
  const filePath = path.resolve(__dirname, "../../test_data/test-data.json");
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as TestDataType;
  } catch (error) {
    throw new Error(`Failed to load test data from ${filePath}: ${error}`);
  }
}

/**
 * Resolve environment variable references in test data.
 *
 * Replaces "$VAR_NAME" with process.env.VAR_NAME, leaving
 * non-prefixed values unchanged.
 *
 * @param value - String that may start with "$"
 * @returns Resolved value or original if not an env reference
 */
export function resolveEnv(value: string): string {
  if (!value.startsWith("$")) {
    return value;
  }
  const envVar = value.slice(1);
  return process.env[envVar] ?? value;
}

/**
 * Get resolved test data with environment variables substituted.
 *
 * @returns Test data with all env vars resolved
 */
export function getResolvedTestData(): TestDataType {
  const raw = loadTestData();
  return {
    ...raw,
    users: {
      existing: {
        username: resolveEnv(raw.users.existing.username),
        password: resolveEnv(raw.users.existing.password),
      },
      invalid: raw.users.invalid,
    },
    checkout: {
      valid: {
        name: resolveEnv(raw.checkout.valid.name),
        country: resolveEnv(raw.checkout.valid.country),
        city: resolveEnv(raw.checkout.valid.city),
        card: resolveEnv(raw.checkout.valid.card),
        month: resolveEnv(raw.checkout.valid.month),
        year: resolveEnv(raw.checkout.valid.year),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-loaded and resolved data (singleton)
// ---------------------------------------------------------------------------

export const testData = getResolvedTestData();

/**
 * Check whether credentials are properly configured in .env.
 *
 * @returns true if TEST_USERNAME is set and not a placeholder
 */
export function hasConfiguredCredentials(): boolean {
  const { username, password } = testData.users.existing;
  return (
    !!username?.trim() &&
    !!password?.trim() &&
    !username.startsWith("$") &&
    !password.startsWith("$")
  );
}
