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
   * Uses Playwright's native type() and keyboard methods to fill form fields.
   * This properly propagates events through the framework event handlers,
   * ensuring compatible behavior in both local and CI (headless) environments.
   *
   * page.evaluate() approach was setting DOM values directly but bypassing
   * jQuery/framework event propagation, causing "Please fill out" validation
   * errors in CI. The type() method simulates actual user typing, ensuring
   * proper event chain from keyboard -> input -> jQuery handlers.
   *
   * Demoblaze shows a browser alert on both success ("sign up successful")
   * and failure ("This user already exist.").
   *
   * @param username - Desired username.
   * @param password - Desired password.
   * @returns The alert dialog message text.
   */
  async signup(username: string, password: string): Promise<string> {
    console.log(`[SignupPage.signup START] username="${username}", password_len=${password.length}`);

    const usernameLocator = this.page.locator(this.USERNAME_INPUT);
    const passwordLocator = this.page.locator(this.PASSWORD_INPUT);

    // Wait for both inputs to be visible
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });

    // Set values using fill()
    console.log(`[SignupPage.signup] Setting username via fill()...`);
    await usernameLocator.fill(username);
    await this.page.waitForTimeout(500);

    console.log(`[SignupPage.signup] Setting password via fill()...`);
    await passwordLocator.fill(password);
    await this.page.waitForTimeout(500);

    // CRITICAL PRE-SUBMISSION DIAGNOSTICS
    const usernameValue = await usernameLocator.inputValue();
    const passwordValue = await passwordLocator.inputValue();
    
    console.log(`\n[SignupPage.signup] ==== PRE-SUBMISSION CHECK ====`);
    console.log(`[SignupPage.signup] Expected: username="${username}", password_len=${password.length}`);
    console.log(`[SignupPage.signup] Actual  : username="${usernameValue}", password_len=${passwordValue.length}`);
    
    // Get HTML to verify form state
    const formHtml = await this.page.locator("form").first().innerHTML().catch(() => "N/A");
    console.log(`[SignupPage.signup] Form HTML length: ${formHtml ? formHtml.length : "N/A"}`);
    
    // Check if inputs are in DOM
    const inputCount = await this.page.locator(this.USERNAME_INPUT).count();
    console.log(`[SignupPage.signup] Username input elements in DOM: ${inputCount}`);
    
    // Get input attributes
    const usernameType = await usernameLocator.getAttribute("type").catch(() => "N/A");
    const usernameRequired = await usernameLocator.getAttribute("required").catch(() => "N/A");
    console.log(`[SignupPage.signup] Username input type="${usernameType}", required="${usernameRequired}"`);
    
    // Get button state
    const buttonEnabled = await this.page.locator(this.SIGNUP_BTN).isEnabled();
    console.log(`[SignupPage.signup] Signup button enabled: ${buttonEnabled}`);
    
    // Try to get the actual DOM values directly
    const domValues = await this.page.evaluate(() => {
      const uInput = document.querySelector('#sign-username') as HTMLInputElement | null;
      const pInput = document.querySelector('#sign-password') as HTMLInputElement | null;
      return {
        usernameDOM: uInput?.value || "NOT FOUND",
        passwordDOM: pInput?.value || "NOT FOUND",
      };
    });
    console.log(`[SignupPage.signup] DOM values: username="${domValues.usernameDOM}", password_len=${domValues.passwordDOM.length}`);
    console.log(`[SignupPage.signup] ==== END PRE-SUBMISSION CHECK ====\n`);

    if (usernameValue !== username) {
      console.log(`[SignupPage.signup] ✕ MISMATCH: Username not set correctly`);
      throw new Error(
        `Username not set: got "${usernameValue}", expected "${username}"`,
      );
    }
    if (passwordValue !== password) {
      console.log(`[SignupPage.signup] ✕ MISMATCH: Password not set correctly`);
      throw new Error(
        `Password not set: length ${passwordValue.length}, expected ${password.length}`,
      );
    }

    console.log(`[SignupPage.signup] ✓ All values match, submitting form...`);

    // Register the dialog handler before clicking (needs to be synchronous)
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        console.log(`[SignupPage.signup] Dialog received: "${message}"`);
        await dialog.accept();
        resolve(message);
      });
    });

    // Submit the form
    console.log(`[SignupPage.signup] Clicking signup button...`);
    await this.click(this.SIGNUP_BTN);
    console.log(`[SignupPage.signup] ✓ Form submitted, waiting for dialog...`);
    
    const result = await alertPromise;
    console.log(`[SignupPage.signup] ✓ Dialog handled, returning: "${result}"`);
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
