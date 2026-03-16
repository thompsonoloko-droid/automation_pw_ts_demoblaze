/**
 * Cart Page Object — interactions for the Demoblaze shopping cart (/cart.html).
 *
 * Provides methods to inspect cart contents, delete items, read the running
 * total, and navigate to the checkout modal.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";
import { TIMEOUTS, URLS, POLLING } from "../tests/shared/constants";

/** A single row in the cart table. */
export interface CartItem {
  name: string;
  price: number;
}

export class CartPage extends BasePage {
  // Cart table
  readonly TABLE_ROWS = "#tbodyid tr";
  readonly TOTAL_PRICE = "#totalp";

  // Actions
  readonly PLACE_ORDER_BTN = ".btn-success";

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate directly to the cart page.
   */
  async navigateToCart(): Promise<void> {
    // Register listener before navigation so the viewcart XHR response is never missed.
    const viewcartDone = this.page
      .waitForResponse((res) => res.url().includes("viewcart"), { timeout: TIMEOUTS.CART_XHR_RESPONSE })
      .catch(() => {});
    await this.page.goto(`${URLS.CART}`, { waitUntil: "domcontentloaded" });
    await viewcartDone;
  }

  /**
   * Wait for the cart's async data to finish loading.
   *
   * The cart table is populated via XHR after page load, so a short
   * delay is needed before counting rows.
   */
  async waitForCartLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded", { timeout: TIMEOUTS.DOM_CONTENT_LOADED }).catch(() => {});
    // Reduced poll — used only in non-navigation contexts (e.g. deleteAllItems).
    // navigateToCart() already waits for the viewcart XHR, so this is a lightweight
    // fallback that avoids excessive looping on empty carts in CI.
    let rowCount = 0;
    let attempts = 0;
    while (rowCount === 0 && attempts < POLLING.CART_LOAD_MAX_ATTEMPTS) {
      rowCount = await this.page.locator(this.TABLE_ROWS).count();
      if (rowCount === 0) {
        await this.page.waitForTimeout(POLLING.CART_LOAD_POLL_INTERVAL);
      }
      attempts++;
    }
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  /**
   * Return the number of product rows currently in the cart.
   */
  async getItemCount(): Promise<number> {
    await this.waitForCartLoad();
    return this.page.locator(this.TABLE_ROWS).count();
  }

  /**
   * Return a structured list of all cart items (name + price).
   */
  async getCartItems(): Promise<CartItem[]> {
    await this.waitForCartLoad();
    const rows = await this.page.locator(this.TABLE_ROWS).all();
    const items: CartItem[] = [];

    for (const row of rows) {
      const cells = row.locator("td");
      if ((await cells.count()) < 3) continue;

      const name = (await cells.nth(1).innerText()).trim();
      const rawPrice = await cells.nth(2).innerText();
      const price = parseInt(rawPrice.replace(/[^0-9]/g, ""), 10);
      items.push({ name, price });
    }

    return items;
  }

  /**
   * Return the total price shown beneath the cart table.
   */
  async getTotalPrice(): Promise<number> {
    // Wait for the element to have numeric content.
    // This covers both loaded carts (total price) and empty carts ("0").
    await this.page.waitForFunction(
      (selector: string) => {
        const el = document.querySelector(selector);
        const text = el?.textContent ?? "";
        return /\d+/.test(text); // At least one digit
      },
      this.TOTAL_PRICE,
      { timeout: TIMEOUTS.DOM_CONTENT_LOADED },
    );

    const text = (await this.page.locator(this.TOTAL_PRICE).textContent()) ?? "0";
    return parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
  }

  /**
   * Return true when the cart table contains no product rows.
   */
  async isCartEmpty(): Promise<boolean> {
    // navigateToCart() has already waited for the viewcart XHR; no extra wait needed.
    return (await this.page.locator(this.TABLE_ROWS).count()) === 0;
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Delete a single cart item by its product name.
   *
   * Finds the row containing the name and clicks its Delete link.
   *
   * @param productName - Exact product name as displayed in the cart.
   */
  async deleteItem(productName: string): Promise<void> {
    const row = this.page.locator(this.TABLE_ROWS).filter({ hasText: productName });
    await row.locator("a:has-text('Delete')").click();
    await this.page.waitForTimeout(TIMEOUTS.CART_ITEM_DELETE);
  }

  /**
   * Delete every item in the cart one by one until it is empty.
   */
  async deleteAllItems(): Promise<void> {
    await this.waitForCartLoad();
    let count = await this.page.locator(this.TABLE_ROWS).count();
    while (count > 0) {
      await this.page.locator(this.TABLE_ROWS).first().locator("a:has-text('Delete')").click();
      await this.page.waitForTimeout(TIMEOUTS.CART_ITEM_POLL * 4); // 800ms = 4 * 200ms
      count = await this.page.locator(this.TABLE_ROWS).count();
    }
  }

  /**
   * Click the 'Place Order' button to open the checkout modal.
   */
  async clickPlaceOrder(): Promise<void> {
    await this.click(this.PLACE_ORDER_BTN);
    await this.page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that a product row with the given name is visible in the cart table.
   *
   * @param productName - Product name to look for.
   */
  async verifyItemInCart(productName: string): Promise<void> {
    const row = this.page.locator(this.TABLE_ROWS).filter({ hasText: productName });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE_SHORT });
  }

  /**
   * Assert the displayed total equals the arithmetic sum of all item prices.
   */
  async verifyTotalMatchesItems(): Promise<void> {
    const items = await this.getCartItems();
    const expected = items.reduce((sum, item) => sum + item.price, 0);
    const actual = await this.getTotalPrice();
    expect(actual).toBe(expected);
  }
}
