/**
 * Performance Tests — Load times, Core Web Vitals, and resource optimization
 *
 * Tests for:
 * - Page load times
 * - DOM content loaded
 * - Largest Contentful Paint (LCP)
 * - Time to First Byte (TTFB)
 * - Resource efficiency
 * - Performance regression detection
 *
 * Test cases: PERF-001 through PERF-012
 */

import { test, expect } from "../fixtures";

test.describe("Performance", () => {
  // ---------[ PERF-001 ] Homepage Load Time --------
  test("PERF-001: Homepage should load within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  // ---------[ PERF-002 ] DOM Content Loaded --------
  test("PERF-002: DOM content should load within 3 seconds", async ({ page, perfUtils }) => {
    await page.goto("/");
    const metrics = await perfUtils.getPageMetrics();

    perfUtils.assertDomContentLoaded(metrics, 3000);
  });

  // ---------[ PERF-003 ] TTFB (Time to First Byte) --------
  test("PERF-003: TTFB should be under 600ms", async ({ page, perfUtils }) => {
    await page.goto("/");
    const metrics = await perfUtils.getPageMetrics();

    perfUtils.assertTimeToFirstByte(metrics, 600);
  });

  // ---------[ PERF-004 ] Largest Contentful Paint (LCP) --------
  test("PERF-004: LCP should occur within 2.5 seconds (Google Web Vitals)", async ({
    page,
    perfUtils,
  }) => {
    await page.goto("/");
    const metrics = await perfUtils.getPageMetrics();

    perfUtils.assertLargestContentfulPaint(metrics, 2500);
  });

  // ---------[ PERF-005 ] Product Page Load Time --------
  test("PERF-005: Product detail page should load within 4 seconds", async ({ page }) => {
    await page.goto("/");

    const start = Date.now();
    await page.click("//a[contains(text(), 'Samsung galaxy s6')]");
    await page.waitForLoadState("networkidle");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(4000);
  });

  // ---------[ PERF-006 ] Shopping Cart Load Time --------
  test("PERF-006: Cart page should load within 3 seconds", async ({ page }) => {
    await page.goto("/");

    const start = Date.now();
    await page.click("#cartur");
    await page.waitForLoadState("networkidle");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });

  // ---------[ PERF-007 ] Resource Count and Size --------
  test("PERF-007: Page should load less than 50 resources", async ({ page, perfUtils }) => {
    await page.goto("/");
    const metrics = await perfUtils.getPageMetrics();

    expect(metrics.resourcesCount).toBeLessThan(50);
  });

  // ---------[ PERF-008 ] Total Resource Size --------
  test("PERF-008: Total page resources should be under 5MB", async ({ page, perfUtils }) => {
    await page.goto("/");
    const metrics = await perfUtils.getPageMetrics();

    const sizeMB = metrics.totalResourcesSize / 1024 / 1024;
    expect(sizeMB).toBeLessThan(5);
  });

  // ---------[ PERF-009 ] Slowest Resources --------
  test("PERF-009: No single resource should take more than 2 seconds", async ({
    page,
    perfUtils,
  }) => {
    await page.goto("/");
    const slowest = await perfUtils.getSlowestResources(5);

    slowest.forEach((resource) => {
      expect(resource.duration).toBeLessThan(2000);
    });
  });

  // ---------[ PERF-010 ] Largest Resources --------
  test("PERF-010: No single resource should exceed 2MB", async ({ page, perfUtils }) => {
    await page.goto("/");
    const largest = await perfUtils.getLargestResources(5);

    largest.forEach((resource) => {
      const sizeMB = resource.size / 1024 / 1024;
      expect(sizeMB).toBeLessThan(2);
    });
  });

  // ---------[ PERF-011 ] Element Visibility Performance --------
  test("PERF-011: Product grid should be visible within 2 seconds", async ({ page, perfUtils }) => {
    await page.goto("/");

    const visibilityTime = await perfUtils.measureElementVisibility(".product-item");

    expect(visibilityTime).toBeLessThan(2000);
  });

  // ---------[ PERF-012 ] Add to Cart Interaction Latency --------
  test("PERF-012: Add to cart button should respond within 500ms", async ({ page, perfUtils }) => {
    await page.goto("/");

    // Navigate to first product
    await page.click("//a[contains(text(), 'Samsung galaxy s6')]");
    await page.waitForSelector(".product-item", { state: "visible" });

    // Measure click latency
    const latency = await perfUtils.measureActionLatency(
      () => page.click("//button[contains(text(), 'Add to cart')]"),
      ".alert-success",
    );

    // Allow up to 1 second for response
    expect(latency).toBeLessThan(1000);
  });
});

// Performance benchmark suite (optional, run separately with --grep @benchmark)
test.describe("Performance Benchmarking (@benchmark)", () => {
  const baselineMetrics: Record<string, any> = {};

  test("PERF-BENCH: Collect homepage baseline", async ({ page, perfUtils }) => {
    await page.goto("/");
    baselineMetrics.homepage = await perfUtils.getPageMetrics();

    console.log("Homepage Metrics:");
    console.log(perfUtils.getSummary(baselineMetrics.homepage));
  });

  test("PERF-BENCH: Collect product page baseline", async ({ page, perfUtils }) => {
    await page.goto("/");
    await page.click("//a[contains(text(), 'Samsung galaxy s6')]");
    await page.waitForLoadState("networkidle");

    baselineMetrics.product = await perfUtils.getPageMetrics();

    console.log("Product Page Metrics:");
    console.log(perfUtils.getSummary(baselineMetrics.product));
  });

  test("PERF-BENCH: Collect cart page baseline", async ({ page, perfUtils }) => {
    await page.goto("/");
    await page.click("#cartur");
    await page.waitForLoadState("networkidle");

    baselineMetrics.cart = await perfUtils.getPageMetrics();

    console.log("Cart Page Metrics:");
    console.log(perfUtils.getSummary(baselineMetrics.cart));
  });
});
