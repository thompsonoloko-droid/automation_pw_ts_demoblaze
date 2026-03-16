/**
 * Cart Page Object — interactions for the Demoblaze shopping cart (/cart.html).
 *
 * Provides methods to inspect cart contents, delete items, read the running
 * total, and navigate to the checkout modal.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";

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
      .waitForResponse((res) => res.url().includes("viewcart"), { timeout: 15000 })
      .catch(() => {});
    await this.page.goto("https://www.demoblaze.com/cart.html", { waitUntil: "domcontentloaded" });
    await viewcartDone;
  }

  /**
   * Wait for the cart's async data to finish loading.
   *
   * The cart table is populated via XHR after page load, so a short
   * delay is needed before counting rows.
   */
  async waitForCartLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {});
    // Poll for cart table rows with increased attempts for slow networks.
    // navigateToCart() already waits for viewcart XHR, but this handles delayed rendering.
    let rowCount = 0;
    let attempts = 0;
    const maxAttempts = 15; // 3 seconds total (15 * 200ms)
    while (rowCount === 0 && attempts < maxAttempts) {
      rowCount = await this.page.locator(this.TABLE_ROWS).count();
      if (rowCount === 0) {
        await this.page.waitForTimeout(200);
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
    // Ensure cart data is loaded before reading total.
    await this.waitForCartLoad();
    // Retry reading total with small delays to handle rendering delays.
    for (let i = 0; i < 5; i++) {
      const text = (await this.page.locator(this.TOTAL_PRICE).textContent()) ?? "";
      const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) return num;
      if (i < 4) await this.page.waitForTimeout(200);
    }
    // Fallback: return 0 if total still can't be read
    return 0;
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
    const deleteLink = row.locator("a:has-text('Delete')");
    await expect(deleteLink).toBeVisible({ timeout: 8000 });
    await deleteLink.click();
    // Wait for XHR to delete item and DOM to update
    await this.page.waitForTimeout(1000); // Increased from 300ms for network
  }

  /**
   * Delete every item in the cart one by one until it is empty.
   * Includes retry logic for network delays.
   */
  async deleteAllItems(): Promise<void> {
    await this.waitForCartLoad();
    let count = await this.page.locator(this.TABLE_ROWS).count();
    let maxIterations = 20; // Prevent infinite loops
    while (count > 0 && maxIterations > 0) {
      const deleteLink = this.page.locator(this.TABLE_ROWS).first().locator("a:has-text('Delete')");
      if (await deleteLink.isVisible()) {
        await deleteLink.click();
        // Wait for XHR response and DOM update
        await this.page.waitForTimeout(1200); // Increased from 800ms for network
      }
      count = await this.page.locator(this.TABLE_ROWS).count();
      maxIterations--;
    }
  }

  /**
   * Click the 'Place Order' button to open the checkout modal.
   */
  async clickPlaceOrder(): Promise<void> {
    await this.click(this.PLACE_ORDER_BTN);
    await this.page.waitForTimeout(500);
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
    await expect(row).toBeVisible({ timeout: 5000 });
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
