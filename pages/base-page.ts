/**
 * Base Page Object — foundation for all Page Object Models (POM).
 *
 * Every page class (LoginPage, HomePage, etc.) inherits from BasePage.
 * It provides shared helpers: click, fill, getText, screenshot, URL checks.
 *
 * Usage:
 *   class LoginPage extends BasePage {
 *     readonly USERNAME_INPUT = "#loginusername";
 *     async enterUsername(u: string) { await this.fill(this.USERNAME_INPUT, u); }
 *   }
 */

import { type Locator, type Page, expect } from "@playwright/test";

export class BasePage {
  /** Default timeout in milliseconds for element waits. */
  readonly timeout: number = 30_000;

  constructor(protected page: Page) {}

  /**
   * Get the underlying Playwright page object.
   *
   * Use sparingly — prefer page object methods when available.
   */
  getPage(): Page {
    return this.page;
  }

  // ---------------------------------------------------------------------------
  // Element interaction
  // ---------------------------------------------------------------------------

  /**
   * Wait for an element to become visible and return its locator.
   *
   * @param selector - CSS selector of the element to wait for.
   * @param timeout  - Max wait time in ms (defaults to `this.timeout`).
   */
  async waitForElement(selector: string, timeout?: number): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout: timeout ?? this.timeout });
    return locator;
  }

  /**
   * Click an element after waiting for it to be visible.
   *
   * Retries automatically if something blocks the click.
   *
   * @param selector   - CSS selector of the element to click.
   * @param timeout    - Max wait time in ms.
   * @param maxRetries - Retry attempts if click is blocked.
   * @param retryDelay - Milliseconds between retries.
   */
  async click(
    selector: string,
    timeout?: number,
    maxRetries = 3,
    retryDelay = 1000,
  ): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const el = await this.waitForElement(selector, timeout);
        await el.click();
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Click attempt ${attempt} failed for '${selector}': ${error}`);
        try {
          await this.page.waitForTimeout(retryDelay);
        } catch {
          // Page may have closed, abort retry loop
          throw error;
        }
      }
    }
    throw new Error(
      `Unable to click element '${selector}' after ${maxRetries} attempts: ${lastError}`,
    );
  }

  /**
   * Wait for an input element to be visible and fill it with text.
   *
   * @param selector - CSS selector of the input element.
   * @param text     - The text to input.
   * @param timeout  - Max wait time in ms.
   */
  async fill(selector: string, text: string, timeout?: number): Promise<void> {
    try {
      const el = await this.waitForElement(selector, timeout);
      await el.fill(text);
    } catch (error) {
      throw new Error(`Failed to fill element '${selector}': ${error}`, { cause: error });
    }
  }

  /**
   * Set an input value through DOM assignment and dispatch common form events.
   *
   * This is more resilient for legacy/jQuery forms in headless CI.
   */
  async setInputValue(selector: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ sel, val }) => {
        const el = document.querySelector(sel) as HTMLInputElement | null;
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      },
      { sel: selector, val: value },
    );
  }

  /**
   * Close a Bootstrap modal if it is currently open.
   */
  async closeModalIfOpen(modalSelector: string, closeSelector: string): Promise<void> {
    const modal = this.page.locator(modalSelector);
    if (!(await modal.isVisible().catch(() => false))) return;

    const closeBtn = this.page.locator(closeSelector);
    if (await closeBtn.count()) {
      // dispatchEvent avoids actionability failures during Bootstrap transitions.
      await closeBtn
        .first()
        .dispatchEvent("click")
        .catch(() => {});
    } else {
      await this.page.keyboard.press("Escape").catch(() => {});
    }

    const hidden = await modal
      .waitFor({ state: "hidden", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!hidden) {
      // Last-resort cleanup for stuck Bootstrap modal/backdrop state.
      await this.page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) {
          el.classList.remove("show");
          el.setAttribute("aria-hidden", "true");
          el.style.display = "none";
        }
        document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
      }, modalSelector);
    }

    await expect(modal).not.toBeVisible({ timeout: 8_000 });
  }

  /**
   * Retrieve the visible text content of an element.
   *
   * @param selector - CSS selector of the element.
   * @param timeout  - Max wait time in ms.
   * @returns The trimmed text content, or empty string.
   */
  async getText(selector: string, timeout?: number): Promise<string> {
    try {
      const el = await this.waitForElement(selector, timeout);
      const text = await el.textContent();
      return text?.trim() ?? "";
    } catch (error) {
      throw new Error(`Failed to get text from element '${selector}': ${error}`, { cause: error });
    }
  }

  /**
   * Capture a screenshot of the current page state.
   *
   * @param name - Descriptive name (timestamp is appended).
   * @returns The file path of the saved screenshot.
   */
  async takeScreenshot(name: string): Promise<string> {
    const timestamp = Date.now();
    const screenshotPath = `./reports/screenshots/${name}_${timestamp}.png`;
    await this.page.screenshot({ path: screenshotPath });
    return screenshotPath;
  }

  /**
   * Verify the current page URL contains the specified text.
   *
   * @param text    - The text that should be present in the URL.
   * @param timeout - Max wait time in ms.
   */
  async verifyUrlContains(text: string, timeout?: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(text), {
      timeout: timeout ?? this.timeout,
    });
  }
}
