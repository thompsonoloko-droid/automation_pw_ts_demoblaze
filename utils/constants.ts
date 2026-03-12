/**
 * Test constants and configuration — selectors, URLs, thresholds, test data
 */

// ─────────────────────────────────────────────────────────────────────────
// URLs
// ─────────────────────────────────────────────────────────────────────────

export const BASE_URL = process.env.BASE_URL || "https://www.demoblaze.com";
export const API_BASE_URL = process.env.API_BASE_URL || "https://api.demoblaze.com";

// ─────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────

export const SELECTORS = {
  // Navigation
  NAVBAR: ".navbar",
  HOME_LINK: "#nava",
  ABOUT_LINK: "#navAbout",
  CONTACT_LINK: "#navContact",

  // Login/Signup
  LOGIN_BTN: "#login2",
  SIGNIN_BTN: "#signin2",
  LOGOUT_BTN: "#logout2",
  LOGIN_MODAL: "#loginModal",
  SIGNUP_MODAL: "#signupModal",
  LOGIN_USERNAME: "#loginusername",
  LOGIN_PASSWORD: "#loginpassword",
  LOGIN_SUBMIT: "//button[contains(text(), 'Log in')]",
  SIGNUP_USERNAME: "#sign-username",
  SIGNUP_PASSWORD: "#sign-password",
  SIGNUP_SUBMIT: "//button[contains(text(), 'Sign up')]",

  // Cart
  CART_BTN: "#cartur",
  CART_TABLE: "#tbodyid",
  CART_ITEM_ROW: "//tr[@class='success']",
  CART_DELETE_BTN: "//button[contains(text(), 'Delete')]",
  CART_TOTAL: "//h3[@id='totalp']",
  PLACE_ORDER_BTN: "//button[contains(text(), 'Place Order')]",

  // Products
  PRODUCT_GRID: ".product-item",
  PRODUCT_TITLE: ".product-title",
  PRODUCT_PRICE: ".product-price",
  ADD_TO_CART_BTN: "//a[contains(text(), 'Add to cart')]",
  PRODUCT_LINK_BY_NAME: (name: string) => `//a[contains(text(), '${name}')]`,

  // Checkout
  CHECKOUT_MODAL: "#orderModal",
  CHECKOUT_NAME: "#name",
  CHECKOUT_COUNTRY: "#country",
  CHECKOUT_CITY: "#city",
  CHECKOUT_CARD: "#card",
  CHECKOUT_MONTH: "#month",
  CHECKOUT_YEAR: "#year",
  CHECKOUT_SUBMIT: "//button[contains(text(), 'Purchase')]",

  // Notifications
  ALERT_SUCCESS: ".alert-success",
  ALERT_DANGER: ".alert-danger",
  ALERT_WARNING: ".alert-warning",
  ALERT_INFO: ".alert-info",

  // User info
  NAMEOFUSER: "#nameofuser",
};

// ─────────────────────────────────────────────────────────────────────────
// Performance Thresholds (milliseconds)
// ─────────────────────────────────────────────────────────────────────────

export const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 5000, // Full page load
  DOM_CONTENT_LOADED: 3000, // DOM ready
  TTFB: 600, // Time to First Byte (network)
  LCP: 2500, // Largest Contentful Paint (Core Web Vitals)
  FIRST_PAINT: 1000, // First paint
  PRODUCT_PAGE_LOAD: 4000,
  CART_PAGE_LOAD: 3000,
  ELEMENT_VISIBILITY: 2000, // Element appears on page
  INTERACTION_LATENCY: 1000, // Button click response
  RESOURCE_COUNT: 50, // Max resources to load
  RESOURCE_SIZE: 5 * 1024 * 1024, // 5MB total
  SINGLE_RESOURCE_MAX: 2 * 1024 * 1024, // 2MB max per resource
};

// ─────────────────────────────────────────────────────────────────────────
// Accessibility Thresholds
// ─────────────────────────────────────────────────────────────────────────

export const A11Y_THRESHOLDS = {
  MAX_CRITICAL_VIOLATIONS: 0, // Zero tolerance
  MAX_SERIOUS_VIOLATIONS: 0, // Zero tolerance
  MAX_MODERATE_VIOLATIONS: 5, // Can fix later
  MAX_MINOR_VIOLATIONS: 10, // Nice to have
  MAX_MISSING_ALT_IMAGES: 2, // Decorative images OK
  MAX_UNLABELED_INPUTS: 2,
  MAX_ARIAssable_MISSING: 3,
};

// ─────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────

export const TEST_USERS = {
  VALID: {
    username: process.env.TEST_USERNAME || "deltest@test.com",
    password: process.env.TEST_PASSWORD || "Password123#",
  },
  INVALID: {
    username: "invalid_user_12345",
    password: "wrong_password_xyz",
  },
  EMPTY: {
    username: "",
    password: "",
  },
  SPECIAL_CHARS: {
    username: "<script>alert('xss')</script>",
    password: "'; DROP TABLE users; --",
  },
};

export const CHECKOUT_DATA = {
  NAME: process.env.CHECKOUT_NAME || "John Doe",
  COUNTRY: process.env.CHECKOUT_COUNTRY || "United Kingdom",
  CITY: process.env.CHECKOUT_CITY || "London",
  CARD: process.env.CHECKOUT_CARD || "4111111111111111",
  MONTH: process.env.CHECKOUT_MONTH || "12",
  YEAR: process.env.CHECKOUT_YEAR || "2027",
};

export const SAMPLE_PRODUCTS = [
  { name: "Samsung galaxy s6", price: 360, id: 1 },
  { name: "Nokia lumia 1520", price: 820, id: 2 },
  { name: "Nexus 6", price: 649, id: 3 },
  { name: "LG G2", price: 556, id: 4 },
  { name: "LG Optimus G", price: 533, id: 5 },
];

// ─────────────────────────────────────────────────────────────────────────
// API Endpoints
// ─────────────────────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  ENTRIES: "/entries",
  BY_CAT: "/bycat",
  VIEW: "/view",
  LOGIN: "/login",
  SIGNUP: "/signup",
  CHECK: "/check",
  ADD_TO_CART: "/addtocart",
  VIEW_CART: "/viewcart",
  DELETE_CART: "/deletecart",
  PLACE_ORDER: "/placeorder",
};

// ─────────────────────────────────────────────────────────────────────────
// Test Markers
// ─────────────────────────────────────────────────────────────────────────

export const TEST_MARKERS = {
  SMOKE: "smoke",
  REGRESSION: "regression",
  API: "api",
  UI: "ui",
  E2E: "e2e",
  ACCESSIBILITY: "accessibility",
  PERFORMANCE: "performance",
  SECURITY: "security",
  SLOW: "slow",
};

// ─────────────────────────────────────────────────────────────────────────
// Timeouts
// ─────────────────────────────────────────────────────────────────────────

export const TIMEOUTS = {
  DEFAULT: 30_000, // 30s default
  ELEMENT_VISIBILITY: 10_000, // 10s for element to appear
  NAVIGATION: 15_000, // 15s for page to load
  MODAL: 5_000, // 5s for modal to appear
  API_REQUEST: 10_000, // 10s for API response
  ACTION: 5_000, // 5s for user action to complete
};
