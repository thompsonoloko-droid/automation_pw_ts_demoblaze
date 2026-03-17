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

    // Focus inputs to ensure they're ready
    await usernameLocator.focus();
    await passwordLocator.focus();
    await this.page.waitForTimeout(200);

    // Use Playwright's fill() method first - most reliable for generic filling
    await usernameLocator.fill(username);
    await passwordLocator.fill(password);

    // Verify values were set
    let usernameValue = await usernameLocator.inputValue();
    let passwordValue = await passwordLocator.inputValue();

    // If values aren't set (can happen in headless), use keyboard input
    if (!usernameValue || !passwordValue) {
      await usernameLocator.click({ force: true });
      await this.page.keyboard.insertText(username);
      await passwordLocator.click({ force: true });
      await this.page.keyboard.insertText(password);
      
      usernameValue = await usernameLocator.inputValue();
      passwordValue = await passwordLocator.inputValue();
    }

    // Ensure events are dispatched via DOM for framework compatibility
    await this.page.evaluate(
      ([uSel, pSel]: [string, string]) => {
        const u = document.querySelector(uSel) as HTMLInputElement | null;
        const p = document.querySelector(pSel) as HTMLInputElement | null;
        
        if (u) {
          u.dispatchEvent(new Event("input", { bubbles: true }));
          u.dispatchEvent(new Event("change", { bubbles: true }));
          u.dispatchEvent(new Event("blur", { bubbles: true }));
        }
        
        if (p) {
          p.dispatchEvent(new Event("input", { bubbles: true }));
          p.dispatchEvent(new Event("change", { bubbles: true }));
          p.dispatchEvent(new Event("blur", { bubbles: true }));
        }
      },
      [this.USERNAME_INPUT, this.PASSWORD_INPUT],
    );

    // Wait for framework to process events
    await this.page.waitForTimeout(500);

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
