/**
 * Product Page Object — interactions for the Demoblaze product detail page.
 *
 * Each product lives at /prod.html?idp_=<id>. This class covers reading
 * title, price, description and adding the item to the cart.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";

export class ProductPage extends BasePage {
  // Product detail elements
  readonly PRODUCT_TITLE = ".name";
  readonly PRODUCT_PRICE = ".price-container";
  readonly PRODUCT_DESC = "#more-information p";
  readonly ADD_TO_CART_BTN = "a.btn:has-text('Add to cart')";

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  /**
   * Wait for the product title to appear, signalling the page has loaded.
   */
  async waitForProductLoad(): Promise<void> {
    await this.page.waitForSelector(this.PRODUCT_TITLE, { timeout: 12_000 });
  }

  /**
   * Return the product title text.
   */
  async getTitle(): Promise<string> {
    return this.getText(this.PRODUCT_TITLE);
  }

  /**
   * Parse and return the product price as a number.
   *
   * The price container typically contains "$360 *includes tax".
   */
  async getPrice(): Promise<number> {
    const raw = await this.getText(this.PRODUCT_PRICE);
    const match = raw.match(/[\d,]+/);
    if (!match) {
      throw new Error(`Could not parse price from text: "${raw}"`);
    }
    return parseInt(match[0].replace(",", ""), 10);
  }

  /**
   * Return the product description paragraph text.
   */
  async getDescription(): Promise<string> {
    return this.getText(this.PRODUCT_DESC);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Click "Add to cart", accept the confirmation alert, and return its text.
   *
   * Demoblaze shows a browser alert "Product added." when an item is added.
   *
   * @returns The alert message text (should match /product added/i).
   */
  async addToCart(): Promise<string> {
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
    await this.click(this.ADD_TO_CART_BTN);
    return alertPromise;
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that title, price, and Add to Cart button are all visible.
   */
  async verifyProductDetailsVisible(): Promise<void> {
    await expect(this.page.locator(this.PRODUCT_TITLE)).toBeVisible();
    await expect(this.page.locator(this.PRODUCT_PRICE)).toBeVisible();
    await expect(this.page.locator(this.ADD_TO_CART_BTN)).toBeVisible();
  }

  /**
   * Assert the displayed title matches the expected value.
   *
   * @param expected - Expected product title string.
   */
  async verifyTitle(expected: string): Promise<void> {
    await expect(this.page.locator(this.PRODUCT_TITLE)).toHaveText(expected, { timeout: 8_000 });
  }

  /**
   * Assert the parsed price matches the expected numeric value.
   *
   * @param expected - Expected price in dollars (e.g. 360).
   */
  async verifyPrice(expected: number): Promise<void> {
    const actual = await this.getPrice();
    expect(actual).toBe(expected);
  }
}
