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
    await this.page.locator(this.NAV_SIGNUP_LINK).click({ force: true }).catch(() => {});
    // Wait for the input field — clearest signal that modal animation is done.
    try {
      await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10000 });
    } catch {
      // Proceed anyway; signup() will handle input readiness.
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

    // Wait for both inputs to be visible and ready
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });

    // Clear any existing values first with keyboard shortcuts
    await usernameLocator.click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Delete");
    await passwordLocator.click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Delete");
    await this.page.waitForTimeout(100);

    // Fill using standard fill method
    await usernameLocator.fill(username);
    await passwordLocator.fill(password);

    // Dispatch input and change events to notify any frameworks watching the inputs
    await this.page.evaluate(
      ([uSel, pSel, uVal, pVal]: [string, string, string, string]) => {
        const u = document.querySelector(uSel) as HTMLInputElement | null;
        const p = document.querySelector(pSel) as HTMLInputElement | null;
        if (u) {
          u.value = uVal;
          u.dispatchEvent(new Event("input", { bubbles: true }));
          u.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (p) {
          p.value = pVal;
          p.dispatchEvent(new Event("input", { bubbles: true }));
          p.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      [this.USERNAME_INPUT, this.PASSWORD_INPUT, username, password],
    );

    // Brief delay to allow framework state to update
    await this.page.waitForTimeout(300);

    // Register the dialog handler before clicking (needs to be synchronous)
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    // Click via normal Playwright click
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
