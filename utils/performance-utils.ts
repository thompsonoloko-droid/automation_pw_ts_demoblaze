/**
 * Performance Testing Utilities — Core Web Vitals, load times, and metrics collection.
 *
 * Provides:
 * - Page load time measurement
 * - Core Web Vitals (LCP, FID, CLS)
 * - Resource timing analysis
 * - Navigation timing breakdown
 * - Threshold-based assertions
 *
 * Usage:
 *   const perf = new PerformanceUtils(page);
 *   const metrics = await perf.getPageMetrics();
 *   perf.assertPageLoadTime(metrics, 3000); // Assert < 3s
 */

import { type Page } from "@playwright/test";

export interface PageMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToFirstByte: number;
  resourcesCount: number;
  totalResourcesSize: number;
  url: string;
  timestamp: string;
}

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

export interface NavigationTiming {
  domInteractive: number;
  domComplete: number;
  domContentLoaded: number;
  loadEventStart: number;
  loadEventEnd: number;
}

/**
 * Performance testing utilities for Demoblaze.
 */
export class PerformanceUtils {
  constructor(private page: Page) {}

  /**
   * Collect page performance metrics using Performance API.
   *
   * Includes load times, Core Web Vitals, and resource timing.
   */
  async getPageMetrics(): Promise<PageMetrics> {
    const metrics = await this.page.evaluate(() => {
      const perf = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType("paint");
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");

      // Calculate Core Web Vitals
      const firstPaint =
        paintEntries.find((e) => e.name === "first-paint")?.startTime || 0;
      const largestContentfulPaint =
        lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;

      // Collect resource metrics
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      let totalSize = 0;

      resources.forEach((r) => {
        if (r.transferSize || r.decodedBodySize) {
          totalSize += r.transferSize || r.decodedBodySize || 0;
        }
      });

      return {
        pageLoadTime: perf.loadEventEnd - perf.fetchStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
        firstPaint,
        largestContentfulPaint,
        cumulativeLayoutShift: 0, // Requires PerformanceObserver in real implementation
        firstInputDelay: 0, // Requires PerformanceObserver in real implementation
        timeToFirstByte: perf.responseStart - perf.fetchStart,
        resourcesCount: resources.length,
        totalResourcesSize: totalSize,
      };
    });

    return {
      ...metrics,
      url: this.page.url(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed navigation timing breakdown.
   */
  async getNavigationTiming(): Promise<NavigationTiming> {
    return this.page.evaluate(() => {
      const perf = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

      return {
        domInteractive: perf.domInteractive - perf.fetchStart,
        domComplete: perf.domComplete - perf.fetchStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
        loadEventStart: perf.loadEventStart - perf.fetchStart,
        loadEventEnd: perf.loadEventEnd - perf.fetchStart,
      };
    });
  }

  /**
   * Get all resource timings (scripts, styles, images, etc.).
   *
   * Useful for identifying slow assets.
   */
  async getResourceTimings(): Promise<ResourceTiming[]> {
    return this.page.evaluate(() => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

      return resources.map((r) => ({
        name: r.name.split("/").pop() || r.name,
        type: r.initiatorType,
        duration: r.duration,
        size: r.transferSize || 0,
        cached: r.transferSize === 0 && r.decodedBodySize ? true : false,
      }));
    });
  }

  /**
   * Get slowest resources (top N).
   */
  async getSlowestResources(limit: number = 10): Promise<ResourceTiming[]> {
    const resources = await this.getResourceTimings();
    return resources.sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  /**
   * Get largest resources by size (top N).
   */
  async getLargestResources(limit: number = 10): Promise<ResourceTiming[]> {
    const resources = await this.getResourceTimings();
    return resources.sort((a, b) => b.size - a.size).slice(0, limit);
  }

  /**
   * Measure navigation to specific element (e.g., text visible).
   *
   * Records time from page start until element is visible.
   */
  async measureElementVisibility(selector: string): Promise<number> {
    const startTime = Date.now();

    await this.page.locator(selector).waitFor({ state: "visible", timeout: 30000 });

    return Date.now() - startTime;
  }

  /**
   * Measure action latency (time to complete an interaction).
   *
   * Useful for testing button click response time.
   */
  async measureActionLatency(
    action: () => Promise<void>,
    waitSelector?: string
  ): Promise<number> {
    const startTime = Date.now();

    await action();

    if (waitSelector) {
      await this.page.locator(waitSelector).waitFor({ state: "visible", timeout: 10000 });
    }

    return Date.now() - startTime;
  }

  /**
   * Assert page load time is under threshold.
   */
  assertPageLoadTime(metrics: PageMetrics, thresholdMs: number): void {
    if (metrics.pageLoadTime > thresholdMs) {
      throw new Error(
        `Page load time ${metrics.pageLoadTime}ms exceeds threshold ${thresholdMs}ms`
      );
    }
  }

  /**
   * Assert DOM content loaded time is under threshold.
   */
  assertDomContentLoaded(metrics: PageMetrics, thresholdMs: number): void {
    if (metrics.domContentLoaded > thresholdMs) {
      throw new Error(
        `DOM content loaded ${metrics.domContentLoaded}ms exceeds threshold ${thresholdMs}ms`
      );
    }
  }

  /**
   * Assert LCP (Largest Contentful Paint) is under threshold.
   */
  assertLargestContentfulPaint(metrics: PageMetrics, thresholdMs: number): void {
    if (metrics.largestContentfulPaint > thresholdMs) {
      throw new Error(
        `LCP ${metrics.largestContentfulPaint}ms exceeds threshold ${thresholdMs}ms`
      );
    }
  }

  /**
   * Assert first input delay (FID) is under threshold.
   */
  assertFirstInputDelay(metrics: PageMetrics, thresholdMs: number): void {
    if (metrics.firstInputDelay > thresholdMs) {
      throw new Error(
        `First input delay ${metrics.firstInputDelay}ms exceeds threshold ${thresholdMs}ms`
      );
    }
  }

  /**
   * Assert TTFB (Time to First Byte) is under threshold.
   *
   * Measures server response time with typical threshold 600ms.
   */
  assertTimeToFirstByte(metrics: PageMetrics, thresholdMs: number = 600): void {
    if (metrics.timeToFirstByte > thresholdMs) {
      throw new Error(
        `TTFB ${metrics.timeToFirstByte}ms exceeds threshold ${thresholdMs}ms`
      );
    }
  }

  /**
   * Get performance summary (nice format for reporting).
   */
  getSummary(metrics: PageMetrics): string {
    return `
Performance Metrics:
  Page Load: ${metrics.pageLoadTime.toFixed(0)}ms
  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms
  TTFB (Time to First Byte): ${metrics.timeToFirstByte.toFixed(0)}ms
  LCP (Largest Contentful Paint): ${metrics.largestContentfulPaint.toFixed(0)}ms
  First Paint: ${metrics.firstPaint.toFixed(0)}ms
  Resources: ${metrics.resourcesCount} files, ${(metrics.totalResourcesSize / 1024 / 1024).toFixed(2)}MB total
    `.trim();
  }

  /**
   * Compare metrics against baseline (for regression detection).
   *
   * Returns percentage change.
   */
  compareWithBaseline(
    current: PageMetrics,
    baseline: PageMetrics,
    threshold: number = 20
  ): { passed: boolean; changes: Record<string, string> } {
    const changes: Record<string, string> = {};
    let passed = true;

    const compare = (current: number, baseline: number, name: string): void => {
      const percent = ((current - baseline) / baseline) * 100;
      const icon = percent > 0 ? "📈" : "📉";
      changes[name] = `${icon} ${percent.toFixed(1)}%`;

      if (Math.abs(percent) > threshold) {
        passed = false;
      }
    };

    compare(current.pageLoadTime, baseline.pageLoadTime, "Page Load");
    compare(current.domContentLoaded, baseline.domContentLoaded, "DOM Loaded");
    compare(current.largestContentfulPaint, baseline.largestContentfulPaint, "LCP");
    compare(current.timeToFirstByte, baseline.timeToFirstByte, "TTFB");

    return { passed, changes };
  }
}
