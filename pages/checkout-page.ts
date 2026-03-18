/**
 * Checkout Page Object — interactions for the Demoblaze order modal.
 *
 * Clicking "Place Order" in the cart opens a Bootstrap modal (#orderModal).
 * After submitting valid details a SweetAlert confirmation dialog appears.
 * This class handles both the form modal and the post-purchase confirmation.
 */

import { expect } from "@playwright/test";

import { BasePage } from "./base-page";

/** Data needed to fill the Place Order form. */
export interface OrderFormData {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

/** Result captured from the SweetAlert confirmation dialog. */
export interface OrderConfirmation {
  title: string;
  details: string;
}

export class CheckoutPage extends BasePage {
  // Order modal
  readonly ORDER_MODAL = "#orderModal";
  readonly NAME_INPUT = "#name";
  readonly COUNTRY_INPUT = "#country";
  readonly CITY_INPUT = "#city";
  readonly CARD_INPUT = "#card";
  readonly MONTH_INPUT = "#month";
  readonly YEAR_INPUT = "#year";
  readonly PURCHASE_BTN = "#orderModal .btn-primary";
  readonly CLOSE_BTN = "#orderModal .close";

  // SweetAlert confirmation
  readonly CONFIRM_ALERT = ".sweet-alert";
  readonly CONFIRM_TITLE = ".sweet-alert h2";
  readonly CONFIRM_DETAILS = ".sweet-alert p.lead";
  readonly CONFIRM_OK_BTN = ".sweet-alert .confirm";

  // ---------------------------------------------------------------------------
  // Modal control
  // ---------------------------------------------------------------------------

  /**
   * Wait for the order modal to open after clicking Place Order.
   */
  async waitForModal(): Promise<void> {
    await this.page.waitForSelector(`${this.ORDER_MODAL}.show`, { timeout: 8_000 });
    await this.page.waitForTimeout(300);
    await expect(this.page.locator(this.ORDER_MODAL)).toBeVisible();
  }

  /**
   * Close the order modal via the × button without placing an order.
   */
  async closeModal(): Promise<void> {
    await this.click(this.CLOSE_BTN);
    await this.page.waitForTimeout(400);
    await expect(this.page.locator(this.ORDER_MODAL)).not.toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Form interaction
  // ---------------------------------------------------------------------------

  /**
   * Fill all order form fields from an OrderFormData object.
   *
   * Fields with an empty string value in the data object are left blank
   * (useful for negative / validation tests).
   *
   * Uses direct DOM manipulation for reliable form filling.
   *
   * @param data - Order form values.
   */
  async fillOrderForm(data: OrderFormData): Promise<void> {
    const fieldConfigs = [
      { selector: this.NAME_INPUT, value: data.name },
      { selector: this.COUNTRY_INPUT, value: data.country },
      { selector: this.CITY_INPUT, value: data.city },
      { selector: this.CARD_INPUT, value: data.card },
      { selector: this.MONTH_INPUT, value: data.month },
      { selector: this.YEAR_INPUT, value: data.year },
    ];

    for (const config of fieldConfigs) {
      if (config.value) {
        await this.setInputValue(config.selector, config.value);
        await this.page.waitForTimeout(50);

        // Verify value was set
        const actualValue = await this.page
          .locator(config.selector)
          .inputValue()
          .catch(() => "");
        console.log(`[CheckoutPage.fillOrderForm] Field ${config.selector}: "${actualValue}"`);
      }
    }
  }

  /**
   * Clear every order form field (used for empty-field negative tests).
   */
  async clearAllFields(): Promise<void> {
    for (const sel of [
      this.NAME_INPUT,
      this.COUNTRY_INPUT,
      this.CITY_INPUT,
      this.CARD_INPUT,
      this.MONTH_INPUT,
      this.YEAR_INPUT,
    ]) {
      await this.page.locator(sel).fill("");
    }
  }

  /**
   * Submit the form and capture the browser alert that appears when
   * a required field is missing.
   *
   * @returns The alert message text.
   */
  async submitExpectAlert(): Promise<string> {
    const alertPromise = new Promise<string>((resolve) => {
      this.page.once("dialog", async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
    await this.click(this.PURCHASE_BTN);
    return alertPromise;
  }

  /**
   * Submit the form and wait for the SweetAlert confirmation modal.
   *
   * @returns Parsed OrderConfirmation (title + details text).
   */
  async submitExpectConfirmation(): Promise<OrderConfirmation> {
    await this.click(this.PURCHASE_BTN);
    await this.page.waitForSelector(this.CONFIRM_ALERT, { timeout: 12_000 });

    const title = (await this.getText(this.CONFIRM_TITLE)).trim();
    const details = (await this.getText(this.CONFIRM_DETAILS)).trim();
    return { title, details };
  }

  /**
   * Dismiss the SweetAlert confirmation by clicking OK.
   */
  async acceptConfirmation(): Promise<void> {
    await this.click(this.CONFIRM_OK_BTN);
    await this.page.waitForTimeout(500);
  }

  /**
   * Full checkout flow: fill form → purchase → capture confirmation → accept.
   *
   * @param data - Order form values.
   * @returns The OrderConfirmation captured from the success alert.
   */
  async completePurchase(data: OrderFormData): Promise<OrderConfirmation> {
    await this.fillOrderForm(data);
    const confirmation = await this.submitExpectConfirmation();
    await this.acceptConfirmation();
    return confirmation;
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert all order form fields and the Purchase button are visible.
   */
  async verifyFormFieldsVisible(): Promise<void> {
    await expect(this.page.locator(this.NAME_INPUT)).toBeVisible();
    await expect(this.page.locator(this.COUNTRY_INPUT)).toBeVisible();
    await expect(this.page.locator(this.CITY_INPUT)).toBeVisible();
    await expect(this.page.locator(this.CARD_INPUT)).toBeVisible();
    await expect(this.page.locator(this.MONTH_INPUT)).toBeVisible();
    await expect(this.page.locator(this.YEAR_INPUT)).toBeVisible();
    await expect(this.page.locator(this.PURCHASE_BTN)).toBeVisible();
  }
}
