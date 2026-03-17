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
    await this.closeModalIfOpen("#logInModal", "#logInModal .close");

    const alreadyOpen = await this.page.locator(this.SIGNUP_MODAL).isVisible().catch(() => false);
    if (!alreadyOpen) {
      await this.page.locator(this.NAV_SIGNUP_LINK).dispatchEvent("click");
    }

    await expect(this.page.locator(this.SIGNUP_MODAL)).toBeVisible({ timeout: 10_000 });
    await expect(this.page.locator(this.USERNAME_INPUT)).toBeVisible({ timeout: 10_000 });
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

    // Verify button is enabled before clicking
    const isEnabled = await submitBtn.isEnabled().catch(() => false);
    console.log(`[SignupPage.signup] Submit button enabled: ${isEnabled}`);

    await this.setInputValue(this.USERNAME_INPUT, username);
    await this.page.waitForTimeout(100);
    console.log(`[SignupPage.signup] Username set to: "${username}"`);

    await this.setInputValue(this.PASSWORD_INPUT, password);
    await this.page.waitForTimeout(100);
    console.log(`[SignupPage.signup] Password set to: "${password}"`);

    // Register dialog handler BEFORE clicking button
    let dialogCaught = false;
    let dialogError: Error | null = null;
    
    const alertPromise = new Promise<string>((resolve, reject) => {
      // Set up dialog listener
      this.page.once("dialog", async (dialog) => {
        dialogCaught = true;
        try {
          const message = dialog.message();
          console.log(`[SignupPage.signup] Dialog caught, message: "${message}"`);
          await dialog.accept();
          resolve(message);
        } catch (err) {
          console.log(`[SignupPage.signup] Error handling dialog: ${err}`);
          reject(err);
        }
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!dialogCaught) {
          dialogError = new Error("Dialog did not appear within 15s");
          console.log(`[SignupPage.signup] Dialog timeout - no dialog captured after 15s`);
          reject(dialogError);
        }
      }, 15000);

      // Click the button to trigger submission
      submitBtn.click().then(() => {
        console.log(`[SignupPage.signup] Button clicked successfully`);
      }).catch((err) => {
        clearTimeout(timeoutHandle);
        console.log(`[SignupPage.signup] Error clicking button: ${err}`);
        reject(err);
      });
    });

    try {
      const result = await alertPromise;
      console.log(`[SignupPage.signup] Returning dialog message: "${result}"`);
      return result;
    } catch (err) {
      // Capture screenshot of failure state
      const screenshotPath = `./reports/screenshots/signup-dialog-fail-${Date.now()}.png`;
      try {
        await this.page.screenshot({ path: screenshotPath });
        console.log(`[SignupPage.signup] Screenshot saved: ${screenshotPath}`);
      } catch (screenshotErr) {
        console.log(`[SignupPage.signup] Could not capture screenshot: ${screenshotErr}`);
      }
      throw err;
    }
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
