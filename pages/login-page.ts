/**
 * Login Page Object — interactions for the Bootstrap login modal.
 *
 * Demoblaze uses a modal dialog for login (not a separate page).
 * This class opens the modal, fills credentials, submits, and validates
 * the result — both success and expected error states.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";

export class LoginPage extends BasePage {
  // Navigation
  readonly NAV_LOGIN_LINK = "#login2";
  readonly NAV_LOGOUT_LINK = "#logout2";
  readonly NAV_USERNAME_DISPLAY = "#nameofuser";

  // Modal container
  readonly LOGIN_MODAL = "#logInModal";

  // Form fields
  readonly USERNAME_INPUT = "#loginusername";
  readonly PASSWORD_INPUT = "#loginpassword";
  readonly LOGIN_BTN = "#logInModal button.btn-primary";
  readonly CLOSE_BTN = "#logInModal .close";

  // ---------------------------------------------------------------------------
  // Modal control
  // ---------------------------------------------------------------------------

  /**
   * Click the nav 'Log in' link and wait for the modal to fully open.
   */
  async openModal(): Promise<void> {
    console.log(`[LoginPage.openModal START]`);
    
    // Check page URL and basic state
    const currentUrl = this.page.url();
    console.log(`[LoginPage.openModal] Current URL: ${currentUrl}`);
    
    // First check if the login link exists in DOM
    const loginLinkCount = await this.page.locator(this.NAV_LOGIN_LINK).count();
    console.log(`[LoginPage.openModal] Login link elements found: ${loginLinkCount}`);
    
    const loginLinkExists = await this.page.locator(this.NAV_LOGIN_LINK).isVisible().catch(() => false);
    console.log(`[LoginPage.openModal] Login link visible: ${loginLinkExists}`);

    // Click the login link
    console.log(`[LoginPage.openModal] Clicking nav login link...`);
    try {
      await this.page.locator(this.NAV_LOGIN_LINK).click({ force: true });
      console.log(`[LoginPage.openModal] ✓ Login link clicked`);
    } catch (err) {
      console.log(`[LoginPage.openModal] ✕ Error clicking login link: ${err}`);
      // Log the page content snippet to debug
      const title = await this.page.title();
      const navHtml = await this.page.locator("nav").first().innerHTML().catch(() => "N/A");
      console.log(`[LoginPage.openModal] Page title: ${title}`);
      console.log(`[LoginPage.openModal] Nav HTML snippet: ${navHtml.substring(0, 200)}`);
      throw err;
    }

    // Small delay for modal animation to start
    await this.page.waitForTimeout(300);

    // Check if modal appears
    console.log(`[LoginPage.openModal] Checking if LOGIN_MODAL becomes visible...`);
    try {
      const modalCount = await this.page.locator(this.LOGIN_MODAL).count();
      console.log(`[LoginPage.openModal] Modal elements found: ${modalCount}`);
      
      await this.page.locator(this.LOGIN_MODAL).waitFor({ state: "visible", timeout: 10000 });
      console.log(`[LoginPage.openModal] ✓ LOGIN_MODAL is now visible`);
    } catch (err) {
      const modalHtml = await this.page.locator(this.LOGIN_MODAL).first().outerHTML().catch(() => "N/A");
      console.log(`[LoginPage.openModal] ✕ LOGIN_MODAL did not become visible: ${err}`);
      console.log(`[LoginPage.openModal] Modal HTML: ${modalHtml.substring(0, 500)}`);
      
      // Capture screenshot showing current state
      const screenshotPath = `./reports/screenshots/loginpage-modal-failure-${Date.now()}.png`;
      try {
        await this.page.screenshot({ path: screenshotPath });
        console.log(`[LoginPage.openModal] Screenshot saved: ${screenshotPath}`);
      } catch (screenshotErr) {
        console.log(`[LoginPage.openModal] Could not capture screenshot: ${screenshotErr}`);
      }
      
      throw err;
    }

    // Wait for the input field
    console.log(`[LoginPage.openModal] Waiting for USERNAME_INPUT to be visible...`);
    try {
      const inputCount = await this.page.locator(this.USERNAME_INPUT).count();
      console.log(`[LoginPage.openModal] Input fields found: ${inputCount}`);
      
      await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10000 });
      console.log(`[LoginPage.openModal] ✓ USERNAME_INPUT is visible, modal fully opened`);
    } catch (err) {
      const inputBox = await this.page.locator(this.USERNAME_INPUT).first().boundingBox().catch(() => null);
      const inputAttrs = await this.page.locator(this.USERNAME_INPUT).first().getAttribute("style").catch(() => "N/A");
      console.log(`[LoginPage.openModal] ✕ USERNAME_INPUT not visible within 10s: ${err}`);
      console.log(`[LoginPage.openModal] Input bounding box: ${JSON.stringify(inputBox)}`);
      console.log(`[LoginPage.openModal] Input style attribute: ${inputAttrs}`);
      throw err;
    }
  }

  /**
   * Close the login modal via the × button and confirm it disappears.
   */
  async closeModal(): Promise<void> {
    await this.click(this.CLOSE_BTN);
    await this.page.waitForTimeout(500);
    await expect(this.page.locator(this.LOGIN_MODAL)).not.toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fill and submit the login form.
   *
   * Uses standard Playwright API (fill, type) instead of page.evaluate()
   * as it's more reliable in headless CI environments.
   *
   * @param username - Demoblaze username.
   * @param password - Demoblaze password.
   */
  async login(username: string, password: string): Promise<void> {
    console.log(`[LoginPage.login START] username="${username}", password_len=${password.length}`);

    const usernameLocator = this.page.locator(this.USERNAME_INPUT);
    const passwordLocator = this.page.locator(this.PASSWORD_INPUT);

    // Use fill() method - Playwright's native input method
    // fill() calls clear() then type(), both go through proper APIs

    console.log(`[LoginPage.login] Setting username via fill()...`);
    await usernameLocator.fill(username);
    await this.page.waitForTimeout(300);

    console.log(`[LoginPage.login] Setting password via fill()...`);
    await passwordLocator.fill(password);
    await this.page.waitForTimeout(300);

    // Verify values are correct before submitting
    const usernameValue = await usernameLocator.inputValue();
    const passwordValue = await passwordLocator.inputValue();
    
    console.log(`[LoginPage.login] Verification: username="${usernameValue}", password_len=${passwordValue.length}`);

    if (usernameValue !== username) {
      throw new Error(`Username not set: got "${usernameValue}", expected "${username}"`);
    }
    if (passwordValue !== password) {
      throw new Error(`Password not set: length ${passwordValue.length}, expected ${password.length}`);
    }

    console.log(`[LoginPage.login] ✓ All values verified, submitting...`);
    
    // Submit the form
    await this.click(this.LOGIN_BTN);
    console.log(`[LoginPage.login] ✓ Form submitted`);
    
    // Wait for page response
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // Ignore timeout
    });
  }

  /**
   * Full happy-path login: open modal → login → assert username shown in nav.
   *
   * @param username - Demoblaze username.
   * @param password - Demoblaze password.
   */
  async loginExpectSuccess(username: string, password: string): Promise<void> {
    await this.openModal();
    await this.login(username, password);
    
    // Wait for a response to the login request
    await this.page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {});
    
    // Wait for the modal to close by checking the overlay is gone
    try {
      await this.page.waitForSelector(`${this.LOGIN_MODAL}.show`, { state: "hidden", timeout: 8000 });
    } catch {
      // If modal doesn't have show class, it's already closed
    }
    
    // Wait for username to appear and have text content
    // API prepends "Welcome " to the username
    const usernameDisplay = this.page.locator(this.NAV_USERNAME_DISPLAY);
    await expect(usernameDisplay).toContainText(username, { timeout: 10000 });
  }

  /**
   * Submit the login form and capture the resulting browser alert text.
   *
   * Useful for asserting error messages on invalid credentials.
   *
   * @param username - Username to attempt.
   * @param password - Password to attempt.
   * @returns The alert dialog message text.
   */
  async loginExpectAlert(username: string, password: string): Promise<string> {
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
    await this.login(username, password);
    return alertPromise;
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that the nav shows the logged-in username.
   *
   * @param username - Expected username text.
   */
  async verifyLoggedIn(username: string): Promise<void> {
    await expect(this.page.locator(this.NAV_USERNAME_DISPLAY)).toContainText(username, {
      timeout: 10000,
    });
  }

  /**
   * Assert that the nav has reverted to the logged-out state (Login link visible).
   */
  async verifyLoggedOut(): Promise<void> {
    await expect(this.page.locator(this.NAV_LOGIN_LINK)).toBeVisible({ timeout: 8000 });
    await expect(this.page.locator(this.NAV_USERNAME_DISPLAY)).not.toBeVisible();
  }

  /**
   * Click the Logout nav link and verify the session ends.
   *
   * Uses dispatchEvent because #logout2 has display:none when logged out —
   * toggled by Demoblaze's inline JS. dispatchEvent fires the DOM click
   * event directly, bypassing Playwright's actionability checks entirely.
   */
  async logout(): Promise<void> {
    // dispatchEvent fires the DOM click event regardless of visibility —
    // #logout2 has display:none toggled by Demoblaze JS so force/regular
    // clicks fail. This triggers the onclick="logOut()" handler directly.
    await this.page.locator(this.NAV_LOGOUT_LINK).dispatchEvent("click");
    await this.verifyLoggedOut();
  }
}
