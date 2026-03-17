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
    
    // First check if the signup link exists
    const signupLinkExists = await this.page.locator(this.NAV_SIGNUP_LINK).isVisible().catch(() => false);
    console.log(`[SignupPage.openModal] Signup link visible: ${signupLinkExists}`);

    // Click the signup link
    console.log(`[SignupPage.openModal] Clicking nav signup link...`);
    try {
      await this.page.locator(this.NAV_SIGNUP_LINK).click({ force: true });
      console.log(`[SignupPage.openModal] ✓ Signup link clicked`);
    } catch (err) {
      console.log(`[SignupPage.openModal] ✕ Error clicking signup link: ${err}`);
      throw err;
    }

    // Check if modal appears
    console.log(`[SignupPage.openModal] Checking if SIGNUP_MODAL becomes visible...`);
    try {
      await this.page.locator(this.SIGNUP_MODAL).waitFor({ state: "visible", timeout: 10000 });
      console.log(`[SignupPage.openModal] ✓ SIGNUP_MODAL is now visible`);
    } catch (err) {
      console.log(`[SignupPage.openModal] ✕ SIGNUP_MODAL did not become visible: ${err}`);
      throw err;
    }

    // Wait for the input field
    console.log(`[SignupPage.openModal] Waiting for USERNAME_INPUT to be visible...`);
    try {
      await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10000 });
      console.log(`[SignupPage.openModal] ✓ USERNAME_INPUT is visible, modal fully opened`);
    } catch (err) {
      // Log and continue - we'll try to fill anyway
      console.log(`[SignupPage.openModal] ⚠️  USERNAME_INPUT not visible within 5s, but continuing. Error: ${err}`);
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
   * Uses direct DOM manipulation to bypass Playwright API differences between
   * local and CI environments. Sets input values, triggers all events, and waits
   * for framework to process before submission.
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

    // Wait for both inputs to be visible
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });

    // Set values DIRECTLY via DOM manipulation to guarantee they're set
    // This approach bypasses Playwright's internal mechanisms which behave differently
    // in headless CI environments vs local testing
    await this.page.evaluate(
      ([uSel, pSel, u, p]: [string, string, string, string]) => {
        const uInput = document.querySelector(uSel) as HTMLInputElement | null;
        const pInput = document.querySelector(pSel) as HTMLInputElement | null;

        if (uInput) {
          // Clear first, then set
          uInput.value = "";
          uInput.value = u;
          // Trigger all relevant events
          uInput.dispatchEvent(new Event("input", { bubbles: true }));
          uInput.dispatchEvent(new Event("change", { bubbles: true }));
          uInput.dispatchEvent(new Event("blur", { bubbles: true }));
        }

        if (pInput) {
          // Clear first, then set
          pInput.value = "";
          pInput.value = p;
          // Trigger all relevant events
          pInput.dispatchEvent(new Event("input", { bubbles: true }));
          pInput.dispatchEvent(new Event("change", { bubbles: true }));
          pInput.dispatchEvent(new Event("blur", { bubbles: true }));
        }
      },
      [this.USERNAME_INPUT, this.PASSWORD_INPUT, username, password],
    );

    // Verify values were actually set via DOM
    const { usernameValue, passwordValue } = await this.page.evaluate(
      ([uSel, pSel]: [string, string]) => {
        const u = document.querySelector(uSel) as HTMLInputElement | null;
        const p = document.querySelector(pSel) as HTMLInputElement | null;
        return {
          usernameValue: u?.value || "",
          passwordValue: p?.value || "",
        };
      },
      [this.USERNAME_INPUT, this.PASSWORD_INPUT],
    );

    // Verify values match what we set
    if (usernameValue !== username || passwordValue !== password) {
      throw new Error(
        `Form fill failed: username="${usernameValue}" (expected "${username}"), password="${passwordValue}" (expected "${password}")`,
      );
    }

    // Extra wait to ensure framework state is updated
    await this.page.waitForTimeout(300);

    // Register the dialog handler before clicking (needs to be synchronous)
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    // Submit the form
    await this.click(this.SIGNUP_BTN);
    return alertPromise;
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
