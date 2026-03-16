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
      await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10_000 });
    } catch {
      // Proceed anyway; signup() will handle input readiness.
    }
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
    await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10_000 });

    // Register the dialog handler before the click so it's ready for either
    // a synchronous alert (empty-field validation) or an async AJAX alert.
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    // Set both field values and trigger the button in one synchronous JS execution,
    // preventing Bootstrap from clearing inputs between fill and click.
    await this.page.evaluate(
      ([uSel, pSel, btnSel, uVal, pVal]: [string, string, string, string, string]) => {
        const u = document.querySelector(uSel) as HTMLInputElement | null;
        const p = document.querySelector(pSel) as HTMLInputElement | null;
        const btn = document.querySelector(btnSel) as HTMLElement | null;
        if (u) u.value = uVal;
        if (p) p.value = pVal;
        if (btn) btn.click();
      },
      [this.USERNAME_INPUT, this.PASSWORD_INPUT, this.SIGNUP_BTN, username, password] as [
        string,
        string,
        string,
        string,
        string,
      ],
    );

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
