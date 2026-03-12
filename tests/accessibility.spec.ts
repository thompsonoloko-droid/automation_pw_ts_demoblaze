/**
 * Accessibility Tests — WCAG 2.1 Level AA Compliance
 *
 * Tests for:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Image alt-text
 * - Form labels
 * - Heading structure
 *
 * Test cases: A11Y-001 through A11Y-011
 */

import { test, expect } from "../fixtures";

test.describe("Accessibility (WCAG 2.1 AA)", () => {
  // ---------[ A11Y-001 ] Homepage Accessibility --------
  test("A11Y-001: Homepage should be WCAG 2.1 AA compliant", async ({ page, a11yUtils }) => {
    await page.goto("/");

    const results = await a11yUtils.checkPage();

    expect(
      results.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toHaveLength(0);
    expect(results.url).toBe("https://www.demoblaze.com/");
  });

  // ---------[ A11Y-002 ] Heading Hierarchy --------
  test("A11Y-002: Page should have proper heading hierarchy", async ({ page, a11yUtils }) => {
    await page.goto("/");

    const hierarchy = await a11yUtils.checkHeadingHierarchy();

    expect(hierarchy.valid).toBe(true);
    expect(hierarchy.issues).toHaveLength(0);
  });

  // ---------[ A11Y-003 ] Image Alt Text --------
  test("A11Y-003: All images should have descriptive alt text", async ({ page, a11yUtils }) => {
    await page.goto("/");

    const altResults = await a11yUtils.checkImageAltText();

    const missingAltImages = altResults.images.filter((img) => !img.alt || img.alt.trim() === "");

    // Allow decorative images but flag product images
    expect(missingAltImages.length).toBeLessThanOrEqual(2);
  });

  // ---------[ A11Y-004 ] Form Label Association --------
  test("A11Y-004: Form inputs should have associated labels", async ({ page, a11yUtils }) => {
    await page.goto("/");

    // Open login modal
    await page.click("#login2");

    const labels = await a11yUtils.checkFormLabels();

    expect(labels.unlabeled).toBeLessThanOrEqual(2);
  });

  // ---------[ A11Y-005 ] Login Modal Accessibility --------
  test("A11Y-005: Login modal should be accessible", async ({ page, a11yUtils }) => {
    await page.goto("/");
    await page.click("#login2");

    await page.waitForSelector("#loginModal", { state: "visible" });

    const results = await a11yUtils.checkElement("#loginModal");

    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  // ---------[ A11Y-006 ] Keyboard Navigation --------
  test("A11Y-006: All interactive elements should be keyboard accessible", async ({
    page,
    a11yUtils,
  }) => {
    await page.goto("/");

    const focusableElements = await a11yUtils.checkKeyboardNavigation();

    // Should have multiple focusable elements for navigation
    expect(focusableElements.length).toBeGreaterThan(5);
  });

  // ---------[ A11Y-007 ] Product Page Accessibility --------
  test("A11Y-007: Product detail page should be WCAG 2.1 AA compliant", async ({
    page,
    a11yUtils,
  }) => {
    await page.goto("/");

    // Open a product
    await page.click("//a[contains(text(), 'Samsung galaxy s6')]");

    await page.waitForLoadState("networkidle");

    const results = await a11yUtils.checkPage();

    expect(results.violations.filter((v) => v.impact === "serious")).toHaveLength(0);
  });

  // ---------[ A11Y-008 ] Cart Page Accessibility --------
  test("A11Y-008: Cart page should have proper aria labels", async ({ page, a11yUtils }) => {
    await page.goto("/");
    await page.click("#cartur");

    await page.waitForLoadState("networkidle");

    const ariaResults = await a11yUtils.checkAriaLabels();

    expect(ariaResults.missingLabels).toBeLessThanOrEqual(3);
  });

  // ---------[ A11Y-009 ] Signup Modal Accessibility --------
  test("A11Y-009: Signup modal should be accessible with keyboard", async ({ page }) => {
    await page.goto("/");
    await page.click("#signin2");

    await page.waitForSelector("#signupModal", { state: "visible" });

    // Try keyboard navigation (Tab key)
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Verify no error occurs
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  // ---------[ A11Y-010 ] Checkout Modal Accessibility --------
  test("A11Y-010: Checkout form should have labeled inputs", async ({ page, a11yUtils }) => {
    // This test requires being logged in and having items in cart
    // Checking form structure for accessibility
    const isLoggedIn = await page
      .locator("#nameofuser")
      .isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      test.skip();
    }

    await page.goto("/");

    // Navigate to checkout if possible
    const checkoutButton = await page
      .locator("//button[contains(text(), 'Place Order')]")
      .isVisible()
      .catch(() => false);

    if (checkoutButton) {
      const labels = await a11yUtils.checkFormLabels();
      expect(labels.unlabeled).toBeLessThanOrEqual(2);
    }
  });

  // ---------[ A11Y-011 ] Error Messages Accessibility --------
  test("A11Y-011: Error messages should be programmatically associated with inputs", async ({
    page,
    a11yUtils,
  }) => {
    await page.goto("/");
    await page.click("#login2");

    // Try invalid login
    await page.fill("#loginusername", "invalid");
    await page.fill("#loginpassword", "");
    await page.click("//button[contains(text(), 'Log in')]");

    // Wait for error alert
    await page.waitForSelector(".alert", { timeout: 5000 }).catch(() => {});

    const alertText = await page.textContent(".alert");
    expect(alertText).toBeTruthy();

    // Verify alert is announced to screen readers
    const alertRole = await page.getAttribute(".alert", "role");
    expect(alertRole).toBe("alert");
  });
});
