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
    await this.closeModalIfOpen("#signInModal", "#signInModal .close");

    const alreadyOpen = await this.page.locator(this.LOGIN_MODAL).isVisible().catch(() => false);
    if (!alreadyOpen) {
      // dispatchEvent is resilient when click actionability is blocked by overlays.
      await this.page.locator(this.NAV_LOGIN_LINK).dispatchEvent("click");
    }

    await expect(this.page.locator(this.LOGIN_MODAL)).toBeVisible({ timeout: 10_000 });
    await expect(this.page.locator(this.USERNAME_INPUT)).toBeVisible({ timeout: 10_000 });
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
   * Uses direct DOM manipulation to set form values reliably across all environments.
   *
   * @param username - Demoblaze username.
   * @param password - Demoblaze password.
   */
  async login(username: string, password: string): Promise<void> {
    const usernameLocator = this.page.locator(this.USERNAME_INPUT);
    const passwordLocator = this.page.locator(this.PASSWORD_INPUT);
    const loginBtn = this.page.locator(this.LOGIN_BTN);

    // Wait for elements
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });
    await loginBtn.waitFor({ state: "visible", timeout: 10000 });

    await this.setInputValue(this.USERNAME_INPUT, username);
    await this.page.waitForTimeout(100);

    await this.setInputValue(this.PASSWORD_INPUT, password);
    await this.page.waitForTimeout(100);

    // Click submit button - this triggers the form submission
    await loginBtn.click();

    // Wait for page response
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // Ignore timeout
    });
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
    const usernameLocator = this.page.locator(this.USERNAME_INPUT);
    const passwordLocator = this.page.locator(this.PASSWORD_INPUT);
    const loginBtn = this.page.locator(this.LOGIN_BTN);

    // Wait for elements
    await usernameLocator.waitFor({ state: "visible", timeout: 10000 });
    await passwordLocator.waitFor({ state: "visible", timeout: 10000 });
    await loginBtn.waitFor({ state: "visible", timeout: 10000 });

    await this.setInputValue(this.USERNAME_INPUT, username);
    await this.page.waitForTimeout(100);

    // Verify username was set
    let usernameValue = await usernameLocator.inputValue().catch(() => "");
    console.log(`[LoginPage.loginExpectAlert] Username set to: "${usernameValue}"`);

    await this.setInputValue(this.PASSWORD_INPUT, password);
    await this.page.waitForTimeout(100);

    // Verify password was set
    let passwordValue = await passwordLocator.inputValue().catch(() => "");
    console.log(`[LoginPage.loginExpectAlert] Password set to: "${passwordValue}"`);

    // Register dialog handler BEFORE clicking button
    let dialogCaught = false;
    
    const alertPromise = new Promise<string>((resolve, reject) => {
      // Set up dialog listener
      this.page.once("dialog", async (dialog) => {
        dialogCaught = true;
        try {
          const message = dialog.message();
          console.log(`[LoginPage.loginExpectAlert] Dialog caught, message: "${message}"`);
          await dialog.accept();
          resolve(message);
        } catch (err) {
          console.log(`[LoginPage.loginExpectAlert] Error handling dialog: ${err}`);
          reject(err);
        }
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!dialogCaught) {
          const error = new Error("Dialog did not appear within 15s");
          console.log(`[LoginPage.loginExpectAlert] Dialog timeout after 15s`);
          reject(error);
        }
      }, 15000);

      // Click button
      loginBtn.click().then(() => {
        console.log(`[LoginPage.loginExpectAlert] Button clicked successfully`);
      }).catch((err) => {
        clearTimeout(timeoutHandle);
        console.log(`[LoginPage.loginExpectAlert] Error clicking button: ${err}`);
        reject(err);
      });
    });

    try {
      const result = await alertPromise;
      console.log(`[LoginPage.loginExpectAlert] Returning dialog message: "${result}"`);
      return result;
    } catch (err) {
      // Capture screenshot of failure state
      const screenshotPath = `./reports/screenshots/login-dialog-fail-${Date.now()}.png`;
      try {
        await this.page.screenshot({ path: screenshotPath });
        console.log(`[LoginPage.loginExpectAlert] Screenshot saved: ${screenshotPath}`);
      } catch (screenshotErr) {
        console.log(`[LoginPage.loginExpectAlert] Could not capture screenshot: ${screenshotErr}`);
      }
      throw err;
    }
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
