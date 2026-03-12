/**
 * UI tests for Demoblaze checkout flow.
 *
 * Covers: Modal open, form visibility, successful purchase, order confirmation,
 *         validation errors, and cancel behaviour.
 *
 * Converted from the demoblaze test plan (CHK-001 → CHK-011).
 */

import fs from "fs";
import path from "path";

import { test, expect } from "../../fixtures";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface TestData {
  users: { existing: { username: string; password: string } };
  products: { phone: { name: string; price: number } };
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

const { phone } = data.products;

// ---------------------------------------------------------------------------
// Setup helper — login + clear cart + add phone
// ---------------------------------------------------------------------------

async function setupCartWithPhone(
  homePage: { navigateToHome: () => Promise<void>; clickProduct: (n: string) => Promise<void> },
  loginPage: { loginExpectSuccess: (u: string, p: string) => Promise<void> },
  cartPage: { navigateToCart: () => Promise<void>; deleteAllItems: () => Promise<void> },
  productPage: { addToCart: () => Promise<string> },
): Promise<void> {
  await homePage.navigateToHome();
  await loginPage.loginExpectSuccess(existingUser.username, existingUser.password);
  await cartPage.navigateToCart();
  await cartPage.deleteAllItems();

  await homePage.navigateToHome();
  await homePage.clickProduct(phone.name);
  await productPage.addToCart();
  await cartPage.navigateToCart();
}

// ---------------------------------------------------------------------------
// Checkout tests
// ---------------------------------------------------------------------------

test.describe("Checkout Flow @checkout @regression", () => {
  test.skip(!credentialsSet, "TEST_USERNAME not set in .env");

  test.beforeEach(async ({ homePage, loginPage, cartPage, productPage }) => {
    await setupCartWithPhone(homePage, loginPage, cartPage, productPage);
  });

  test("CHK-001 | clicking Place Order opens the checkout modal", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await expect(checkoutPage.getPage().locator(checkoutPage.ORDER_MODAL)).toBeVisible();
  });

  test("CHK-002 | checkout modal displays all required form fields", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await checkoutPage.verifyFormFieldsVisible();
  });

  test("CHK-003 | valid form data triggers a purchase confirmation", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    const confirmation = await checkoutPage.completePurchase(checkoutData);
    expect(confirmation.title).toMatch(/thank you/i);
  });

  test("CHK-004 | confirmation details include the purchase amount", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    const confirmation = await checkoutPage.completePurchase(checkoutData);
    expect(confirmation.details).toContain(String(phone.price));
  });

  test("CHK-005 | confirmation details include the customer name", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    const confirmation = await checkoutPage.completePurchase(checkoutData);
    expect(confirmation.details).toContain(checkoutData.name);
  });

  test("CHK-006 | submitting with all empty fields shows validation alert", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await checkoutPage.clearAllFields();
    const message = await checkoutPage.submitExpectAlert();
    expect(message).toMatch(/fill out|please/i);
  });

  test("CHK-007 | submitting with name field missing shows validation alert", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await checkoutPage.fillOrderForm({ ...checkoutData, name: "" });
    const message = await checkoutPage.submitExpectAlert();
    expect(message).toMatch(/fill out|please/i);
  });

  test("CHK-008 | closing the modal leaves cart items intact", async ({
    cartPage,
    checkoutPage,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await checkoutPage.closeModal();

    // Re-navigate to cart — the item should still be there
    await cartPage.navigateToCart();
    await cartPage.verifyItemInCart(phone.name);
  });

  test("CHK-009 | order modal can be dismissed via the × close button", async ({
    cartPage,
    checkoutPage,
    page,
  }) => {
    await cartPage.clickPlaceOrder();
    await checkoutPage.waitForModal();
    await checkoutPage.closeModal();
    await expect(page.locator(checkoutPage.ORDER_MODAL)).not.toBeVisible();
  });

  test("CHK-010 | cart total is greater than zero before checkout", async ({ cartPage }) => {
    const total = await cartPage.getTotalPrice();
    expect(total).toBeGreaterThan(0);
  });
});
