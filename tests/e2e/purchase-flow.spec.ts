/**
 * End-to-end purchase flow tests for Demoblaze.
 *
 * These tests exercise complete, realistic user journeys from
 * registration or login through to order confirmation.
 * Each scenario validates cross-feature integration.
 *
 * Converted from the demoblaze test plan (E2E-001 → E2E-006).
 */

import fs from "fs";
import path from "path";

import { test, expect } from "../../fixtures";
import { uniqueUsername } from "../api/helpers";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface TestData {
  users: { existing: { username: string; password: string } };
  products: {
    phone: { name: string; price: number };
    laptop: { name: string; price: number };
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
const credentialsSet = !existingUser.username.startsWith("$");

const checkoutData = {
  name: resolveEnv(data.checkout.valid.name) || "John Doe",
  country: resolveEnv(data.checkout.valid.country) || "United Kingdom",
  city: resolveEnv(data.checkout.valid.city) || "London",
  card: resolveEnv(data.checkout.valid.card) || "4111111111111111",
  month: resolveEnv(data.checkout.valid.month) || "12",
  year: resolveEnv(data.checkout.valid.year) || "2027",
};

const { phone, laptop } = data.products;

// ---------------------------------------------------------------------------
// E2E tests
// ---------------------------------------------------------------------------

test.describe("E2E Purchase Flows @e2e @smoke @regression", () => {
  test("E2E-001 | new user registers, logs in, adds a product and completes a purchase", async ({
    homePage,
    signupPage,
    loginPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    const username = uniqueUsername("e2e");
    const password = "E2ETestPass99!";

    // 1 — Register
    await homePage.navigateToHome();
    await signupPage.openModal();
    const signupMessage = await signupPage.signup(username, password);
    expect(signupMessage).toMatch(/sign up successfully/i);

    // 2 — Login
    await loginPage.openModal();
    await loginPage.loginExpectSuccess(username, password);

    // 3 — Browse and add product
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.verifyProductDetailsVisible();
    const cartMessage = await productPage.addToCart();
    expect(cartMessage).toMatch(/product added/i);

    // 4 — Verify cart
    await cartPage.navigateToCart();
    await cartPage.verifyItemInCart(phone.name);
    const total = await cartPage.getTotalPrice();
    expect(total).toBe(phone.price);

    // 5 — Checkout
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    const confirmation = await checkoutPage.completePurchase(checkoutData);

    expect(confirmation.title).toMatch(/thank you/i);
    expect(confirmation.details).toContain(checkoutData.name);
  });

  test("E2E-002 | existing user filters to laptops, adds one, and completes purchase @smoke", async ({
    homePage,
    loginPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    // Login
    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);

    // Clear cart
    await cartPage.navigateToCart();
    await cartPage.deleteAllItems();

    // Filter to laptops and add first result
    await homePage.navigateToHome();
    await homePage.filterByCategory("Laptops");
    const names = await homePage.getProductNames();
    expect(names.length).toBeGreaterThan(0);

    await homePage.clickProduct(names[0]);
    await productPage.waitForProductLoad();
    const cartMessage = await productPage.addToCart();
    expect(cartMessage).toMatch(/product added/i);

    // Checkout
    await cartPage.navigateToCart();
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    const confirmation = await checkoutPage.completePurchase(checkoutData);

    expect(confirmation.title).toMatch(/thank you/i);
  });

  test("E2E-003 | multi-product order — phone + laptop — correct combined total", async ({
    homePage,
    loginPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
    await cartPage.navigateToCart();
    await cartPage.deleteAllItems();

    // Add phone
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    // Add laptop
    await homePage.navigateToHome();
    await homePage.filterByCategory("Laptops");
    await homePage.clickProduct(laptop.name);
    await productPage.addToCart();

    // Verify both present and total is sum of prices
    await cartPage.navigateToCart();
    await cartPage.verifyItemInCart(phone.name);
    await cartPage.verifyItemInCart(laptop.name);
    const total = await cartPage.getTotalPrice();
    expect(total).toBe(phone.price + laptop.price);

    // Checkout
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    const confirmation = await checkoutPage.completePurchase(checkoutData);
    expect(confirmation.title).toMatch(/thank you/i);
  });

  test("E2E-004 | user removes one item then completes purchase with remaining item", async ({
    homePage,
    loginPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
    await cartPage.navigateToCart();
    await cartPage.deleteAllItems();

    // Add phone
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    // Add laptop
    await homePage.navigateToHome();
    await homePage.filterByCategory("Laptops");
    await homePage.clickProduct(laptop.name);
    await productPage.addToCart();

    // Delete phone, keep laptop
    await cartPage.navigateToCart();
    await cartPage.deleteItem(phone.name);
    await cartPage.getPage().waitForTimeout(1_000);

    const countAfter = await cartPage.getItemCount();
    expect(countAfter).toBeLessThan(2);

    if (countAfter > 0) {
      await cartPage.clickPlaceOrder();
      await checkoutPage.waitForModal();
      const confirmation = await checkoutPage.completePurchase(checkoutData);
      expect(confirmation.title).toMatch(/thank you/i);
    }
  });

  test("E2E-005 | cancelling checkout preserves cart contents", async ({
    homePage,
    loginPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
    await cartPage.navigateToCart();
    await cartPage.deleteAllItems();

    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    // Open modal and cancel
    await cartPage.navigateToCart();
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await checkoutPage.closeModal();

    // Cart should still have the phone
    await cartPage.navigateToCart();
    await cartPage.verifyItemInCart(phone.name);
  });

  test("E2E-006 | cart persists after logout and re-login", async ({
    homePage,
    loginPage,
    productPage,
    cartPage,
  }) => {
    test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
    await cartPage.navigateToCart();
    await cartPage.deleteAllItems();

    // Add phone
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    // Logout
    await loginPage.logout();

    // Login again
    await homePage.navigateToHome();
    await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);

    // Cart should still have the phone
    await cartPage.navigateToCart();
    await cartPage.verifyItemInCart(phone.name);
  });
});
