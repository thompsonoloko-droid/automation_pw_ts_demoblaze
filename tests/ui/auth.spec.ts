/**
 * UI tests for Demoblaze authentication flows.
 *
 * Covers: Signup, Login, Logout — positive, negative, and modal behaviour.
 *
 * Converted from the demoblaze test plan (AUTH-001 → AUTH-015).
 */

import fs from "fs";
import path from "path";

import { test, expect } from "../../fixtures";
import { uniqueUsername } from "../api/helpers";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface TestData {
  users: {
    existing: { username: string; password: string };
    invalid: { username: string; password: string };
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
}

function loadData(): TestData {
  const filePath = path.resolve(__dirname, "../../test_data/test-data.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TestData;
}

function resolveEnv(value: string): string {
  return value.startsWith("$") ? (process.env[value.slice(1)] ?? value) : value;
}

// ---------------------------------------------------------------------------

const data = loadData();
const existingUser = {
  username: resolveEnv(data.users.existing.username),
  password: resolveEnv(data.users.existing.password),
};
const credentialsSet =
  !!existingUser.username.trim() &&
  !!existingUser.password.trim() &&
  !existingUser.username.startsWith("$") &&
  !existingUser.password.startsWith("$");

// ---------------------------------------------------------------------------
// Signup tests
// ---------------------------------------------------------------------------

test.describe("Signup @auth @regression", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigateToHome();
  });

  test("AUTH-001 | signup with a new unique username shows success alert", async ({
    signupPage,
  }) => {
    const username = uniqueUsername("ui_reg");
    await signupPage.openModal();
    const message = await signupPage.signup(username, "SecurePass99!");
    expect(message).toMatch(new RegExp(data.signup.success_message, "i"));
  });

  test("AUTH-002 | signup modal opens and shows all required fields", async ({ signupPage }) => {
    await signupPage.openModal();
    await signupPage.verifyModalOpen();
  });

  test("AUTH-003 | duplicate username shows conflict alert", async ({ signupPage }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await signupPage.openModal();
    const message = await signupPage.signup(existingUser.username, existingUser.password);
    expect(message).toMatch(/already exist/i);
  });

  test("AUTH-004 | empty username shows validation alert", async ({ signupPage }) => {
    await signupPage.openModal();
    const message = await signupPage.signup("", "AnyPassword1");
    expect(message).toMatch(/fill out|please/i);
  });

  test("AUTH-005 | empty password shows validation alert", async ({ signupPage }) => {
    await signupPage.openModal();
    const message = await signupPage.signup(uniqueUsername("nopwd"), "");
    expect(message).toMatch(/fill out|please/i);
  });

  test("AUTH-006 | signup modal closes when × is clicked", async ({ signupPage }) => {
    await signupPage.openModal();
    await signupPage.closeModal();
    await expect(signupPage.getPage().locator(signupPage.SIGNUP_MODAL)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Login tests
// ---------------------------------------------------------------------------

test.describe("Login @auth @regression", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigateToHome();
  });

  test("AUTH-007 | valid credentials display username in nav bar", async ({ loginPage }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
  });

  test("AUTH-008 | login modal opens and shows all required fields", async ({
    loginPage,
    page,
  }) => {
    await loginPage.openModal();
    await expect(page.locator(loginPage.LOGIN_MODAL)).toBeVisible();
    await expect(page.locator(loginPage.USERNAME_INPUT)).toBeVisible();
    await expect(page.locator(loginPage.PASSWORD_INPUT)).toBeVisible();
    await expect(page.locator(loginPage.LOGIN_BTN)).toBeVisible();
  });

  test("AUTH-009 | unknown username shows user-not-found alert", async ({ loginPage }) => {
    await loginPage.openModal();
    const message = await loginPage.loginExpectAlert(
      data.users.invalid.username,
      data.users.invalid.password,
    );
    expect(message).toMatch(/user does not exist/i);
  });

  test("AUTH-010 | correct username but wrong password shows error alert", async ({
    loginPage,
  }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await loginPage.openModal();
    const message = await loginPage.loginExpectAlert(existingUser.username, "wrongpassword99");
    expect(message).toMatch(/wrong password/i);
  });

  test("AUTH-011 | empty username shows validation alert", async ({ loginPage }) => {
    await loginPage.openModal();
    const message = await loginPage.loginExpectAlert("", "anyPassword");
    expect(message).toMatch(/fill out|please/i);
  });

  test("AUTH-012 | empty password shows validation alert", async ({ loginPage }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await loginPage.openModal();
    const message = await loginPage.loginExpectAlert(existingUser.username, "");
    expect(message).toMatch(/fill out|please/i);
  });

  test("AUTH-013 | login modal closes when × is clicked", async ({ loginPage, page }) => {
    await loginPage.openModal();
    await loginPage.closeModal();
    await expect(page.locator(loginPage.LOGIN_MODAL)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Logout tests
// ---------------------------------------------------------------------------

test.describe("Logout @auth @regression", () => {
  test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

  test("AUTH-014 | logout hides username and shows login and signup links", async ({
    homePage,
    loginPage,
    page,
  }) => {
    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
    await loginPage.logout();

    await expect(page.locator(loginPage.NAV_LOGIN_LINK)).toBeVisible({ timeout: 6_000 });
    await expect(page.locator("#signin2")).toBeVisible();
    await expect(page.locator(loginPage.NAV_USERNAME_DISPLAY)).not.toBeVisible();
  });

  test("AUTH-015 | session persists after navigating to cart and back", async ({
    homePage,
    loginPage,
    page,
  }) => {
    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);

    await page.goto("https://www.demoblaze.com/cart.html");
    await page.waitForLoadState("domcontentloaded", { timeout: 8_000 }).catch(() => {});
    await homePage.navigateToHome();

    await loginPage.verifyLoggedIn(existingUser.username);
  });
});
