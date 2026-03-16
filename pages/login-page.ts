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
    await this.page.locator(this.NAV_LOGIN_LINK).click({ force: true }).catch(() => {});
    // Wait for the input field — clearest signal that modal animation is done.
    // Avoids fixed timeouts and Bootstrap event race conditions.
    try {
      await this.page.locator(this.USERNAME_INPUT).waitFor({ state: "visible", timeout: 10000 });
    } catch {
      // Proceed anyway; login() will handle input readiness.
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
   * @param username - Demoblaze username.
   * @param password - Demoblaze password.
   */
  async login(username: string, password: string): Promise<void> {
    const usernameLocator = this.page.locator(this.USERNAME_INPUT);
    const passwordLocator = this.page.locator(this.PASSWORD_INPUT);

    // Wait for both inputs to be visible and ready
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });

    // Clear any existing values first
    await usernameLocator.fill("");
    await passwordLocator.fill("");
    await this.page.waitForTimeout(100);

    // Fill with force to handle any overlay issues
    await usernameLocator.fill(username, { force: true });
    await passwordLocator.fill(password, { force: true });

    // If either value is empty, retry with keyboard-based clearing
    const usernameValue = await usernameLocator.inputValue();
    const passwordValue = await passwordLocator.inputValue();
    
    if (!usernameValue || !passwordValue) {
      // Clear with keyboard shortcuts for better browser compatibility
      await usernameLocator.click();
      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Delete");
      await passwordLocator.click();
      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Delete");
      await this.page.waitForTimeout(100);
      
      // Fill again
      await usernameLocator.fill(username);
      await passwordLocator.fill(password);
    }

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

    // Click via normal Playwright click (more reliable than direct dispatchEvent)
    await this.click(this.LOGIN_BTN);
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
