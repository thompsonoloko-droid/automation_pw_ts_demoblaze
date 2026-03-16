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
    // Use force:true to bypass pointer events interception
    await this.page.locator(this.NAV_LOGIN_LINK).click({ force: true }).catch(() => {});

    // Wait for Bootstrap's shown.bs.modal event — fires AFTER the CSS animation
    // completes, which is more reliable than .show class + fixed timeout.
    try {
      await this.page.evaluate(() => {
        return new Promise<void>((resolve) => {
          const modal = document.getElementById("logInModal");
          if (!modal) { resolve(); return; }
          // Already fully open?
          if (
            modal.classList.contains("show") &&
            window.getComputedStyle(modal).display !== "none" &&
            parseFloat(window.getComputedStyle(modal).opacity) >= 1
          ) {
            resolve();
            return;
          }
          modal.addEventListener("shown.bs.modal", () => resolve(), { once: true });
          setTimeout(resolve, 4_000); // fallback so we never hang
        });
      });
    } catch {
      // page evaluate can fail if context is destroyed
    }
  }

  /**
   * Close the login modal via the × button and confirm it disappears.
   */
  async closeModal(): Promise<void> {
    await this.click(this.CLOSE_BTN);
    await this.page.waitForTimeout(400);
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
    await this.page.waitForLoadState("domcontentloaded", { timeout: 8_000 }).catch(() => {});
    
    // Wait for the modal to close by checking the overlay is gone
    try {
      await this.page.waitForSelector(`${this.LOGIN_MODAL}.show`, { state: "hidden", timeout: 5_000 });
    } catch {
      // If modal doesn't have show class, it's already closed
    }
    
    // Wait for username to appear and have text content
    // API prepends "Welcome " to the username
    const usernameDisplay = this.page.locator(this.NAV_USERNAME_DISPLAY);
    await expect(usernameDisplay).toContainText(username, { timeout: 10_000 });
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
      timeout: 10_000,
    });
  }

  /**
   * Assert that the nav has reverted to the logged-out state (Login link visible).
   */
  async verifyLoggedOut(): Promise<void> {
    await expect(this.page.locator(this.NAV_LOGIN_LINK)).toBeVisible({ timeout: 6_000 });
    await expect(this.page.locator(this.NAV_USERNAME_DISPLAY)).not.toBeVisible();
  }

  /**
   * Click the Logout nav link and verify the session ends.
   *
   * Uses force:true because #logout2 is toggled via inline style by Demoblaze JS
   * and may not report as 'visible' even when the user is logged in.
   */
  async logout(): Promise<void> {
    await this.page.locator(this.NAV_LOGOUT_LINK).click({ force: true });
    await this.verifyLoggedOut();
  }
}
