/**
 * Home Page Object — interactions for the Demoblaze main landing page.
 *
 * Provides navigation helpers, category filtering, product grid access,
 * and pagination controls.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";

export class HomePage extends BasePage {
  // Navigation bar
  readonly NAV_HOME = "a.navbar-brand";
  readonly NAV_CART = "#cartur";

  // Hero carousel
  readonly CAROUSEL = "#carouselExampleIndicators";

  // Category sidebar
  readonly CAT_PHONES = "a.list-group-item:has-text('Phones')";
  readonly CAT_LAPTOPS = "a.list-group-item:has-text('Laptops')";
  readonly CAT_MONITORS = "a.list-group-item:has-text('Monitors')";

  // Product grid
  readonly PRODUCT_CARDS = "#tbodyid .card";
  readonly PRODUCT_LINKS = "#tbodyid .card-title a";

  // Pagination
  readonly NEXT_BTN = "#next2";
  readonly PREV_BTN = "#prev2";

  readonly BASE_URL = "https://www.demoblaze.com";

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to the home page and wait for the product grid to populate.
   */
  async navigateToHome(): Promise<void> {
    console.log(`[HomePage] Navigating to ${this.BASE_URL}...`);
    await this.page.goto(this.BASE_URL, { waitUntil: "domcontentloaded" });
    console.log(`[HomePage] ✓ Page loaded (domcontentloaded)`);
    
    console.log(`[HomePage] Waiting for auth nav links to be ready...`);
    try {
      await this.page.locator("#login2, #signin2").first().waitFor({ state: "visible", timeout: 10000 });
      console.log(`[HomePage] ✓ Auth nav links are ready`);
    } catch (err) {
      console.log(`[HomePage] ⚠️  Auth nav links not immediately visible: ${err}`);
    }
    
    await this.waitForProducts();
    console.log(`[HomePage] ✓ navigateToHome complete`);
  }

  /**
   * Navigate to the shopping cart page.
   */
  async navigateToCart(): Promise<void> {
    await this.click(this.NAV_CART);
    await this.page.waitForURL("**/cart.html", { timeout: 10_000 });
  }

  // ---------------------------------------------------------------------------
  // Product grid
  // ---------------------------------------------------------------------------

  /**
   * Wait for at least one product card to appear in the grid.
   */
  async waitForProducts(): Promise<void> {
    // Non-throwing: product AJAX can be slow in CI; tests assert on specific
    // elements themselves rather than relying on this setup guard.
    console.log(`[HomePage] Waiting for product cards (timeout 30s)...`);
    await this.page.waitForSelector(this.PRODUCT_CARDS, { timeout: 30_000 }).catch((err) => {
      console.log(`[HomePage] ⚠️  Products not loaded within 30s: ${err}`);
    });
    console.log(`[HomePage] ✓ waitForProducts complete`);
  }

  /**
   * Return the number of product cards currently displayed.
   */
  async getProductCount(): Promise<number> {
    await this.waitForProducts();
    return this.page.locator(this.PRODUCT_CARDS).count();
  }

  /**
   * Return the text of all visible product title links.
   */
  async getProductNames(): Promise<string[]> {
    await this.waitForProducts();
    return this.page.locator(this.PRODUCT_LINKS).allInnerTexts();
  }

  /**
   * Click a product card by its display name and wait for the detail page.
   *
   * @param productName - Exact product title as shown in the card.
   */
  async clickProduct(productName: string): Promise<void> {
    await this.page.locator(`a:has-text("${productName}")`).first().click();
    await this.page.waitForLoadState("domcontentloaded", { timeout: 8_000 }).catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // Category filter
  // ---------------------------------------------------------------------------

  /**
   * Click a category filter and wait for the product grid to refresh.
   *
   * @param category - One of "Phones", "Laptops", or "Monitors".
   */
  async filterByCategory(category: "Phones" | "Laptops" | "Monitors"): Promise<void> {
    const selectorMap = {
      Phones: this.CAT_PHONES,
      Laptops: this.CAT_LAPTOPS,
      Monitors: this.CAT_MONITORS,
    };
    await this.click(selectorMap[category]);
    await this.page.waitForTimeout(1_500); // wait for AJAX grid update
    await this.waitForProducts();
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  /**
   * Click the Next pagination button and wait for the grid to refresh.
   */
  async goToNextPage(): Promise<void> {
    await this.click(this.NEXT_BTN);
    await this.page.waitForTimeout(1_500);
    await this.waitForProducts();
  }

  /**
   * Click the Previous pagination button and wait for the grid to refresh.
   */
  async goToPrevPage(): Promise<void> {
    await this.click(this.PREV_BTN);
    await this.page.waitForTimeout(1_500);
    await this.waitForProducts();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert all three category links are visible in the sidebar.
   */
  async verifyCategoriesVisible(): Promise<void> {
    await expect(this.page.locator(this.CAT_PHONES)).toBeVisible();
    await expect(this.page.locator(this.CAT_LAPTOPS)).toBeVisible();
    await expect(this.page.locator(this.CAT_MONITORS)).toBeVisible();
  }

  /**
   * Assert the carousel hero banner is visible on the home page.
   */
  async verifyCarouselVisible(): Promise<void> {
    await expect(this.page.locator(this.CAROUSEL)).toBeVisible();
  }
}
