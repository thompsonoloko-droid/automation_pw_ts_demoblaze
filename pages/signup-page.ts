/**
 * Signup Page Object — interactions for the Bootstrap sign-up modal.
 *
 * Demoblaze user registration uses a modal dialog triggered from the nav bar.
 * This class handles opening, filling, submitting, and reading the result alert.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";

export class SignupPage extends BasePage {
  // Navigation
  readonly NAV_SIGNUP_LINK = "#signin2";

  // Modal container
  readonly SIGNUP_MODAL = "#signInModal";

  // Form fields
  readonly USERNAME_INPUT = "#sign-username";
  readonly PASSWORD_INPUT = "#sign-password";
  readonly SIGNUP_BTN = "#signInModal button.btn-primary";
  readonly CLOSE_BTN = "#signInModal .close";

  // ---------------------------------------------------------------------------
  // Modal control
  // ---------------------------------------------------------------------------

  /**
   * Click the nav 'Sign up' link and wait for the modal to fully open.
   */
  async openModal(): Promise<void> {
    console.log(`[SignupPage.openModal START]`);
    
    // Check page URL and basic state
    const currentUrl = this.page.url();
    console.log(`[SignupPage.openModal] Current URL: ${currentUrl}`);
    
    // First check if the signup link exists in DOM
    const signupLinkCount = await this.page.locator(this.NAV_SIGNUP_LINK).count();
    console.log(`[SignupPage.openModal] Signup link elements found: ${signupLinkCount}`);
    
    const signupLinkExists = await this.page.locator(this.NAV_SIGNUP_LINK).isVisible().catch(() => false);
    console.log(`[SignupPage.openModal] Signup link visible: ${signupLinkExists}`);

    // Click the signup link
    console.log(`[SignupPage.openModal] Clicking nav signup link...`);
    try {
      await this.page.locator(this.NAV_SIGNUP_LINK).click({ force: true });
      console.log(`[SignupPage.openModal] ✓ Signup link clicked`);
    } catch (err) {
      console.log(`[SignupPage.openModal] ✕ Error clicking signup link: ${err}`);
      // Log the page content snippet to debug
      const title = await this.page.title();
      const navHtml = await this.page.locator("nav").first().innerHTML().catch(() => "N/A");
      console.log(`[SignupPage.openModal] Page title: ${title}`);
      console.log(`[SignupPage.openModal] Nav HTML snippet: ${navHtml.substring(0, 200)}`);
      throw err;
    }

    // Small delay for modal animation to start
    await this.page.waitForTimeout(300);

    // Check if modal appears
    console.log(`[SignupPage.openModal] Checking if SIGNUP_MODAL becomes visible...`);
    try {
      const modalCount = await this.page.locator(this.SIGNUP_MODAL).count();
      console.log(`[SignupPage.openModal] Modal elements found: ${modalCount}`);
      
      await this.page.locator(this.SIGNUP_MODAL).waitFor({ state: "visible", timeout: 10000 });
      console.log(`[SignupPage.openModal] ✓ SIGNUP_MODAL is now visible`);
    } catch (err) {
      const modalHtml = await this.page.locator(this.SIGNUP_MODAL).first().outerHTML().catch(() => "N/A");
      console.log(`[SignupPage.openModal] ✕ SIGNUP_MODAL did not become visible: ${err}`);
      console.log(`[SignupPage.openModal] Modal HTML: ${modalHtml.substring(0, 500)}`);
      
      // Capture screenshot showing current state
      const screenshotPath = `./reports/screenshots/signuppage-modal-failure-${Date.now()}.png`;
      try {
        await this.page.screenshot({ path: screenshotPath });
        console.log(`[SignupPage.openModal] Screenshot saved: ${screenshotPath}`);
      } catch (screenshotErr) {
        console.log(`[SignupPage.openModal] Could not capture screenshot: ${screenshotErr}`);
      }
      
      throw err;
    }

    // Wait for the input field
    console.log(`[SignupPage.openModal] Waiting for USERNAME_INPUT to be visible...`);
    try {
      const inputCount = await this.page.locator(this.USERNAME_INPUT).count();
      console.log(`[SignupPage.openModal] Input fields found: ${inputCount}`);
      
      await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10000 });
      console.log(`[SignupPage.openModal] ✓ USERNAME_INPUT is visible, modal fully opened`);
    } catch (err) {
      const inputBox = await this.page.locator(this.USERNAME_INPUT).first().boundingBox().catch(() => null);
      const inputAttrs = await this.page.locator(this.USERNAME_INPUT).first().getAttribute("style").catch(() => "N/A");
      console.log(`[SignupPage.openModal] ✕ USERNAME_INPUT not visible within 10s: ${err}`);
      console.log(`[SignupPage.openModal] Input bounding box: ${JSON.stringify(inputBox)}`);
      console.log(`[SignupPage.openModal] Input style attribute: ${inputAttrs}`);
      throw err;
    }
  }

  /**
   * Close the signup modal via the × button.
   */
  async closeModal(): Promise<void> {
    await this.click(this.CLOSE_BTN);
    await this.page.waitForTimeout(500);
    await expect(this.page.locator(this.SIGNUP_MODAL)).not.toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fill and submit the signup form, then capture and return the alert message.
   *
   * Fills form fields using Playwright fill(), then clicks submit button.
   * This is the most reliable method that works in both local and CI environments.
   *
   * Demoblaze shows a browser alert on both success ("sign up successful")
   * and failure ("This user already exist.").
   *
   * @param username - Desired username.
   * @param password - Desired password.
   * @returns The alert dialog message text.
   */
  async signup(username: string, password: string): Promise<string> {
    const usernameLocator = this.page.locator(this.USERNAME_INPUT);
    const passwordLocator = this.page.locator(this.PASSWORD_INPUT);
    const submitBtn = this.page.locator(this.SIGNUP_BTN);

    // Wait for inputs to be ready
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });
    await submitBtn.waitFor({ state: "visible", timeout: 10000 });

    // Fill form fields
    await usernameLocator.fill(username);
    await this.page.waitForTimeout(100);
    await passwordLocator.fill(password);
    await this.page.waitForTimeout(100);

    // Register dialog handler BEFORE clicking button
    // Demoblaze will show an alert on successful submission or validation error
    const alertPromise = Promise.race([
      new Promise<string>((resolve) => {
        this.page.once("dialog", async (dialog) => {
          const message = dialog.message();
          await dialog.accept();
          resolve(message);
        });
      }),
      // Timeout after 15s if dialog never appears
      new Promise<string>((_resolve, reject) => {
        setTimeout(() => reject(new Error("Dialog did not appear within 15s")), 15000);
      }),
    ]);

    // Click submit button to trigger form submission
    await submitBtn.click();

    // Wait for dialog and return message (or timeout error)
    const result = await alertPromise;
    return result;
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that the signup modal is currently visible.
   */
  async verifyModalOpen(): Promise<void> {
    await expect(this.page.locator(this.SIGNUP_MODAL)).toBeVisible();
    await expect(this.page.locator(this.USERNAME_INPUT)).toBeVisible();
    await expect(this.page.locator(this.PASSWORD_INPUT)).toBeVisible();
    await expect(this.page.locator(this.SIGNUP_BTN)).toBeVisible();
  }
}
