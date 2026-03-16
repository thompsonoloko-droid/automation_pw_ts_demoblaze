/**
 * Centralized timeout and wait constants.
 *
 * Consolidates all magic numbers scattered throughout the codebase
 * for easy maintenance and environment-specific tuning.
 *
 * Usage:
 *   import { TIMEOUTS } from '../shared/constants';
 *   await page.waitForTimeout(TIMEOUTS.MODAL_ANIMATION);
 */

// ---------------------------------------------------------------------------
// Playwright global timeouts (milliseconds)
// ---------------------------------------------------------------------------

export const TIMEOUTS = {
  // Modal interactions — time for Bootstrap animations to complete
  MODAL_ANIMATION: 400,
  MODAL_OPEN_WAIT: 10_000,

  // Form interactions — time for frameworks to process input events
  INPUT_DISPATCH_DELAY: 200,
  FORM_VALIDATION_WAIT: 8_000,

  // Page loads — time for async XHR data to populate DOM
  DOM_CONTENT_LOADED: 8_000,
  ASYNC_XHR_LOAD: 15_000,
  PAGE_FULL_LOAD: 30_000,

  // Element visibility — time to wait for specific elements
  ELEMENT_VISIBLE: 30_000,
  ELEMENT_VISIBLE_SHORT: 8_000,

  // Dialog/alert handling
  DIALOG_ACCEPT_WAIT: 5_000,

  // API requests — time for backend responses
  API_REQUEST: 30_000,

  // Cart operations — time for cart XHR responses
  CART_XHR_RESPONSE: 15_000,
  CART_ITEM_DELETE: 1_000,
  CART_ITEM_POLL: 200,

  // Performance thresholds — maximum acceptable times
  ELEMENT_VISIBILITY_PERF: 12_000,
  PRODUCT_GRID_LOAD_PERF: 6_000,
  ADD_TO_CART_LATENCY_PERF: 500,

  // Navigation timeout
  NAVIGATION_TIMEOUT: 15_000,

  // Action timeout (used in actionTimeout config)
  ACTION_TIMEOUT: 10_000,
  ACTION_TIMEOUT_EXTENDED: 30_000,
};

// ---------------------------------------------------------------------------
// URL constants (for easier refactoring if site changes)
// ---------------------------------------------------------------------------

export const URLS = {
  BASE: "https://www.demoblaze.com",
  API_BASE: "https://api.demoblaze.com",
  CART: "https://www.demoblaze.com/cart.html",
  HOME: "https://www.demoblaze.com",
};

// ---------------------------------------------------------------------------
// Demoblaze API endpoints
// ---------------------------------------------------------------------------

export const API_ENDPOINTS = {
  ENTRIES: "/entries",
  BYCAT: "/bycat",
  VIEW: "/view",
  LOGIN: "/login",
  SIGNUP: "/signup",
  CHECK: "/check",
  VIEWCART: "/viewcart",
  ADDTOCART: "/addtocart",
  DELETECART: "/deletecart",
  PLACEORDER: "/placeorder",
};

// ---------------------------------------------------------------------------
// Common retry configuration
// ---------------------------------------------------------------------------

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1_000,
  EXPONENTIAL_BACKOFF: true,
};

// ---------------------------------------------------------------------------
// Polling configuration
// ---------------------------------------------------------------------------

export const POLLING = {
  CART_LOAD_MAX_ATTEMPTS: 5,
  CART_LOAD_POLL_INTERVAL: 200,
};
