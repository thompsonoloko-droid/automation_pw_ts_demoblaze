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
    await this.click(this.NAV_SIGNUP_LINK);
    await this.page.waitForSelector(`${this.SIGNUP_MODAL}.show`, { timeout: 8_000 });
    await this.page.waitForTimeout(250);
  }

  /**
   * Close the signup modal via the × button.
   */
  async closeModal(): Promise<void> {
    await this.click(this.CLOSE_BTN);
    await this.page.waitForTimeout(400);
    await expect(this.page.locator(this.SIGNUP_MODAL)).not.toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fill and submit the signup form, then capture and return the alert message.
   *
   * Demoblaze shows a browser alert on both success ("sign up successful")
   * and failure ("This user already exist.").
   *
   * @param username - Desired username.
   * @param password - Desired password.
   * @returns The alert dialog message text.
   */
  async signup(username: string, password: string): Promise<string> {
    const usernameInput = this.page.locator(this.USERNAME_INPUT);
    const passwordInput = this.page.locator(this.PASSWORD_INPUT);

    // Wait for inputs to be stable (modal animation may still be running)
    await usernameInput.waitFor({ state: "visible", timeout: 8_000 });

    // Retry fill in case the modal is mid-animation and clears the value
    for (let attempt = 0; attempt < 3; attempt++) {
      await usernameInput.fill(username);
      await passwordInput.fill(password);

      const uVal = await usernameInput.inputValue();
      const pVal = await passwordInput.inputValue();
      if ((username && !uVal) || (password && !pVal)) {
        await this.page.waitForTimeout(300);
        continue;
      }
      break;
    }

    // Final validation — only check fields that were supposed to be non-empty
    if (username) {
      const uVal = await usernameInput.inputValue();
      if (!uVal) throw new Error(`Username field not filled after retries`);
    }
    if (password) {
      const pVal = await passwordInput.inputValue();
      if (!pVal) throw new Error(`Password field not filled after retries`);
    }

    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

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
