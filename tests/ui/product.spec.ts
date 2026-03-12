/**
 * UI tests for Demoblaze product browsing.
 *
 * Covers: Home page listing, category filtering, pagination,
 *         product detail page, and add-to-cart confirmation.
 *
 * Converted from the demoblaze test plan (PROD-001 → PROD-015).
 */

import fs from "fs";
import path from "path";

import { test, expect } from "../../fixtures";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

interface TestData {
  products: {
    phone: { name: string; category: string; price: number };
    laptop: { name: string; category: string; price: number };
    monitor: { name: string; category: string; price: number };
  };
}

function loadData(): TestData {
  const filePath = path.resolve(__dirname, "../../test_data/test-data.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TestData;
}

// ---------------------------------------------------------------------------

const { products } = loadData();

// ---------------------------------------------------------------------------
// Home page — product listing
// ---------------------------------------------------------------------------

test.describe("Product Listing @products @smoke @regression", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigateToHome();
  });

  test("PROD-001 | home page displays at least one product card", async ({ homePage }) => {
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });

  test("PROD-002 | hero carousel is visible on home page", async ({ homePage }) => {
    await homePage.verifyCarouselVisible();
  });

  test("PROD-003 | all three category nav links are visible", async ({ homePage }) => {
    await homePage.verifyCategoriesVisible();
  });

  test("PROD-004 | Phones filter loads phone products", async ({ homePage }) => {
    await homePage.filterByCategory("Phones");
    const names = await homePage.getProductNames();

    expect(names.length).toBeGreaterThan(0);
    const hasPhone = names.some((n) => /samsung|nokia|iphone|nexus|htc/i.test(n));
    expect(hasPhone).toBe(true);
  });

  test("PROD-005 | Laptops filter loads laptop products", async ({ homePage }) => {
    await homePage.filterByCategory("Laptops");
    const names = await homePage.getProductNames();

    expect(names.length).toBeGreaterThan(0);
    const hasLaptop = names.some((n) => /sony|dell|apple|hp|asus|vaio/i.test(n));
    expect(hasLaptop).toBe(true);
  });

  test("PROD-006 | Monitors filter loads monitor products", async ({ homePage }) => {
    await homePage.filterByCategory("Monitors");
    const names = await homePage.getProductNames();
    expect(names.length).toBeGreaterThan(0);
  });

  test("PROD-007 | Next button loads additional products", async ({ homePage }) => {
    await homePage.goToNextPage();
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });

  test("PROD-008 | Prev button navigates back to previous products", async ({ homePage }) => {
    await homePage.goToNextPage();
    await homePage.goToPrevPage();
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Product detail page
// ---------------------------------------------------------------------------

test.describe("Product Detail @products @regression", () => {
  test("PROD-009 | clicking a product card opens detail page with title and price", async ({
    homePage,
    productPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(products.phone.name);

    await productPage.verifyProductDetailsVisible();
    const price = await productPage.getPrice();
    expect(price).toBeGreaterThan(0);
  });

  test("PROD-010 | product detail page shows a non-empty description", async ({
    homePage,
    productPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(products.phone.name);

    const desc = await productPage.getDescription();
    expect(desc.length).toBeGreaterThan(0);
  });

  test("PROD-011 | Add to cart button is visible and enabled on detail page", async ({
    homePage,
    productPage,
    page,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(products.phone.name);

    await expect(page.locator(productPage.ADD_TO_CART_BTN)).toBeVisible();
    await expect(page.locator(productPage.ADD_TO_CART_BTN)).toBeEnabled();
  });

  test(`PROD-012 | ${products.phone.name} displays price $${products.phone.price}`, async ({
    homePage,
    productPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(products.phone.name);
    await productPage.verifyPrice(products.phone.price);
  });

  test("PROD-013 | Add to cart shows product-added confirmation alert", async ({
    homePage,
    productPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.clickProduct(products.phone.name);
    const message = await productPage.addToCart();
    expect(message).toMatch(/product added/i);
  });

  test(`PROD-014 | laptop product displays price $${products.laptop.price}`, async ({
    homePage,
    productPage,
  }) => {
    await homePage.navigateToHome();
    await homePage.filterByCategory("Laptops");
    await homePage.clickProduct(products.laptop.name);
    await productPage.verifyPrice(products.laptop.price);
  });
});
