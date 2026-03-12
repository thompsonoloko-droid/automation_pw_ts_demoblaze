/**
 * API tests for Demoblaze authentication endpoints.
 *
 * Endpoints covered:
 *   POST /login   — returns "Auth_token: <token>" on success, error string on failure.
 *   POST /signup  — returns null on success, error string on failure.
 *   POST /check   — validates a session token.
 *
 * Note: Demoblaze always responds with HTTP 200 — the error state
 * is encoded in the response body.
 */

import { test, expect } from "@playwright/test";

import {
  API_BASE_URL,
  PERF,
  getTestUser,
  loadTestData,
  uniqueUsername,
  resolveEnv,
} from "./helpers";

const testData = loadTestData();
const user = getTestUser();

test.describe("Auth API — Login @api @auth", () => {
  test.skip(!user.username || user.username.startsWith("$"), "TEST_USERNAME not set in .env");

  test("valid credentials return an auth token", async ({ request }) => {
    const start = Date.now();

    const response = await request.post(`${API_BASE_URL}/login`, {
      data: { username: user.username, password: user.password },
    });
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/auth_token/i);

    expect(elapsed).toBeLessThan(PERF.api_response_ms);
  });

  test("wrong password returns error body", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/login`, {
      data: { username: user.username, password: "definitelyWrong99!" },
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/wrong password/i);
  });

  test("unknown username returns user-not-found error", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/login`, {
      data: { username: "ghost_user_xyz_001", password: "anything" },
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/user does not exist/i);
  });

  // Data-driven invalid attempts from test-data.json
  const invalidAttempts = testData.invalid_login_attempts;

  for (const attempt of invalidAttempts) {
    test(`invalid login — ${attempt.id}`, async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/login`, {
        data: {
          username: resolveEnv(attempt.username),
          password: attempt.password,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body).toMatch(new RegExp(attempt.expected_message, "i"));
    });
  }
});

test.describe("Auth API — Signup @api @auth", () => {
  test("new unique username registers successfully", async ({ request }) => {
    const username = uniqueUsername("api_reg");

    const response = await request.post(`${API_BASE_URL}/signup`, {
      data: { username, password: "TestPass123!" },
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    // Success returns null (JSON null stringified)
    expect(body).not.toMatch(/already exist/i);
  });

  test("duplicate username returns conflict message", async ({ request }) => {
    test.skip(!user.username || user.username.startsWith("$"), "TEST_USERNAME not set in .env");

    const response = await request.post(`${API_BASE_URL}/signup`, {
      data: { username: user.username, password: user.password },
    });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/already exist/i);
  });
});

test.describe("Auth API — Check @api @auth", () => {
  test("POST /check with existing username returns 200", async ({ request }) => {
    test.skip(!user.username || user.username.startsWith("$"), "TEST_USERNAME not set in .env");

    const response = await request.post(`${API_BASE_URL}/check`, {
      data: { token: user.username },
    });

    expect(response.status()).toBe(200);
  });
});
