/**
 * Utilities index — centralized exports
 */

export { AccessibilityUtils, type A11yViolation, type A11yResults } from "./accessibility-utils";
export {
  PerformanceUtils,
  type PageMetrics,
  type ResourceTiming,
  type NavigationTiming,
} from "./performance-utils";
export { ApiUtils, DEMOBLAZE_API_BASE } from "./api-utils";

export {
  log,
  logDebug,
  logInfo,
  logWarn,
  logError,
  LogLevel,
  retryWithBackoff,
  waitForCondition,
  randomString,
  generateTestEmail,
  generateTestUsername,
  generateTestPassword,
  takeScreenshot,
  getPageHTML,
  isElementVisible,
  getPageText,
  assertNoJSErrors,
  assertSuccessStatus,
  assertWithinTolerance,
  formatDuration,
  formatBytes,
  formatTable,
} from "./helpers";

export {
  BASE_URL,
  API_BASE_URL,
  SELECTORS,
  PERFORMANCE_THRESHOLDS,
  A11Y_THRESHOLDS,
  TEST_USERS,
  CHECKOUT_DATA,
  SAMPLE_PRODUCTS,
  API_ENDPOINTS,
  TEST_MARKERS,
  TIMEOUTS,
} from "./constants";
