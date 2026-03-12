/**
 * Custom Playwright fixtures — TypeScript equivalent of Python conftest.py.
 *
 * Provides pre-initialised Demoblaze page objects to every test so
 * specs can be concise and declarative.
 */

import { test as base } from "@playwright/test";

import { CartPage } from "./pages/cart-page";
import { CheckoutPage } from "./pages/checkout-page";
import { HomePage } from "./pages/home-page";
import { LoginPage } from "./pages/login-page";
import { ProductPage } from "./pages/product-page";
import { SignupPage } from "./pages/signup-page";
import { AccessibilityUtils } from "./utils/accessibility-utils";
import { PerformanceUtils } from "./utils/performance-utils";
import { ApiUtils } from "./utils/api-utils";

// ---------------------------------------------------------------------------
// Fixture type declarations
// ---------------------------------------------------------------------------

type Fixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  a11yUtils: AccessibilityUtils;
  perfUtils: PerformanceUtils;
  apiUtils: ApiUtils;
};

// ---------------------------------------------------------------------------
// Extended test with fixtures
// ---------------------------------------------------------------------------

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },

  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  a11yUtils: async ({ page }, use) => {
    await use(new AccessibilityUtils(page));
  },

  perfUtils: async ({ page }, use) => {
    await use(new PerformanceUtils(page));
  },

  apiUtils: async ({ request }, use) => {
    await use(new ApiUtils(request));
  },
});

export { expect } from "@playwright/test";
