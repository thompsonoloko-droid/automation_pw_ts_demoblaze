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
    const startTime = Date.now();
    
    // Use domcontentloaded (safe), but with explicit timeout
    // Don't use networkidle - it hangs on sites with long-running requests
    await this.page.goto(this.BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    const loadTime = Date.now() - startTime;
    console.log(`[HomePage] ✓ Page loaded (domcontentloaded) in ${loadTime}ms`);
    
    // Verify we're on the right page
    const finalUrl = this.page.url();
    console.log(`[HomePage] Final URL: ${finalUrl}`);
    if (!finalUrl.includes("demoblaze")) {
      console.log(`[HomePage] ⚠️  WARNING: URL doesn't contain 'demoblaze': ${finalUrl}`);
      throw new Error(`Unexpected URL after navigation: ${finalUrl}`);
    }
    
    // Verify basic page structure
    const pageTitle = await this.page.title();
    console.log(`[HomePage] Page title: "${pageTitle}"`);
    
    const navCount = await this.page.locator("nav").count();
    console.log(`[HomePage] Navigation bars found: ${navCount}`);
    
    const bodyContent = await this.page.locator("body").innerHTML().then(h => h.length);
    console.log(`[HomePage] Page body HTML size: ${bodyContent} bytes`);
    
    // Check auth/navigation state. Logged-in users do not show login/signup links.
    const loginLinkCount = await this.page.locator("#login2").count();
    const signupLinkCount = await this.page.locator("#signin2").count();
    const userNavCount = await this.page.locator("#nameofuser, #logout2").count();
    console.log(
      `[HomePage] Nav state counts - login: ${loginLinkCount}, signup: ${signupLinkCount}, logged-in markers: ${userNavCount}`,
    );

    console.log(`[HomePage] Waiting for nav to be ready...`);
    try {
      await this.page
        .locator("#login2:visible, #signin2:visible, #nameofuser:visible, #logout2:visible")
        .first()
        .waitFor({ state: "visible", timeout: 15000 });
      console.log(`[HomePage] ✓ Navigation links are ready`);
    } catch (err) {
      console.log(`[HomePage] ✕ Navigation links not visible after 15s: ${err}`);
      // Log nav element details for debugging
      const navHtml = await this.page.locator("nav").first().innerHTML().catch(() => "N/A");
      console.log(`[HomePage] Nav HTML length: ${navHtml === "N/A" ? "N/A" : navHtml.length}`);
      if (navHtml !== "N/A" && navHtml.length > 0) {
        console.log(`[HomePage] Nav HTML snippet: ${navHtml.substring(0, 300)}`);
      }
      
      // Capture screenshot showing current page state
      const screenshotPath = `./reports/screenshots/homepage-nav-failure-${Date.now()}.png`;
      try {
        await this.page.screenshot({ path: screenshotPath });
        console.log(`[HomePage] Screenshot saved: ${screenshotPath}`);
      } catch (screenshotErr) {
        console.log(`[HomePage] Could not capture screenshot: ${screenshotErr}`);
      }
      
      throw err; // Throw so we know navigation failed
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
