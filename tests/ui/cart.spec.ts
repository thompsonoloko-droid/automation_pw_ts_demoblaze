/**
 * UI tests for Demoblaze shopping cart management.
 *
 * Covers: Add items, view cart, delete items, totals,
 *         duplicate items, page refresh persistence.
 *
 * Converted from the demoblaze test plan (CART-001 → CART-010).
 */

import fs from "fs";
import path from "path";

import { test, expect } from "../../fixtures";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface TestData {
  users: { existing: { username: string; password: string } };
  products: {
    phone: { name: string; price: number };
    laptop: { name: string; price: number };
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
const { phone, laptop } = data.products;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Login + clear cart before each test that needs a clean cart. */
async function loginAndClearCart(
  homePage: { navigateToHome: () => Promise<void> },
  loginPage: { loginExpectSuccess: (u: string, p: string) => Promise<void> },
  cartPage: { navigateToCart: () => Promise<void>; deleteAllItems: () => Promise<void> },
): Promise<void> {
  await homePage.navigateToHome();
  await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
  await cartPage.navigateToCart();
  await cartPage.deleteAllItems();
}

// ---------------------------------------------------------------------------
// Cart tests
// ---------------------------------------------------------------------------

test.describe("Cart Management @cart @regression", () => {
  test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

  test.beforeEach(async ({ homePage, loginPage, cartPage }) => {
    await loginAndClearCart(homePage, loginPage, cartPage);
  });

  test("CART-001 | empty cart shows no rows and a zero total", async ({ cartPage }) => {
    await cartPage.navigateToCart();
    const isEmpty = await cartPage.isCartEmpty();
    expect(isEmpty).toBe(true);
    const total = await cartPage.getTotalPrice();
    expect(total).toBe(0);
  });

  test("CART-002 | Place Order button is visible on cart page", async ({ cartPage }) => {
    await cartPage.navigateToCart();
    await expect(cartPage.getPage().locator(cartPage.PLACE_ORDER_BTN)).toBeVisible();
  });

  test("CART-003 | added product appears as a row in the cart table", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    await cartPage.verifyItemInCart(phone.name);
  });

  test("CART-004 | cart total updates to reflect the added item price", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    const total = await cartPage.getTotalPrice();
    expect(total).toBe(phone.price);
  });

  test("CART-005 | adding two different products shows both in the cart", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    // Add phone
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    // Add laptop
    await homePage.navigateToHome();
    await homePage.filterByCategory("Laptops");
    await homePage.clickProduct(laptop.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    const count = await cartPage.getItemCount();
    expect(count).toBeGreaterThanOrEqual(2);
    await cartPage.verifyItemInCart(phone.name);
    await cartPage.verifyItemInCart(laptop.name);
  });

  test("CART-006 | displayed total equals the sum of all item prices", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    await cartPage.verifyTotalMatchesItems();
  });

  test("CART-007 | deleting the only item leaves the cart empty", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    await cartPage.deleteItem(phone.name);

    // Re-navigate to confirm server-side deletion
    await cartPage.navigateToCart();
    const isEmpty = await cartPage.isCartEmpty();
    expect(isEmpty).toBe(true);
  });

  test("CART-008 | deleting one item keeps the remaining item intact", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    // Add two items
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    await homePage.navigateToHome();
    await homePage.filterByCategory("Laptops");
    await homePage.clickProduct(laptop.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    await cartPage.deleteItem(phone.name);
    await cartPage.getPage().waitForTimeout(1_000);

    // Laptop should still be there
    await cartPage.verifyItemInCart(laptop.name);
  });

  test("CART-009 | adding the same product twice creates two rows", async ({
    homePage,
    productPage,
    cartPage,
  }) => {
    for (let i = 0; i < 2; i++) {
      await homePage.navigateToHome();
      await homePage.clickProduct(phone.name);
      await productPage.addToCart();
    }

    await cartPage.navigateToCart();
    const count = await cartPage.getItemCount();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("CART-010 | cart items persist after a page refresh", async ({
    homePage,
    productPage,
    cartPage,
    page,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(phone.name);
    await productPage.addToCart();

    await cartPage.navigateToCart();
    await page.reload({ waitUntil: "domcontentloaded" });
    await cartPage.waitForCartLoad();
    await cartPage.verifyItemInCart(phone.name);
  });
});
