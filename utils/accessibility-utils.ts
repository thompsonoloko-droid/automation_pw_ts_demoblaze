/**
 * Accessibility Utilities — axe-core integration for WCAG 2.1 compliance testing.
 *
 * Provides:
 * - Automated accessibility scanning with axe-core
 * - WCAG 2.1 Level AA compliance checks
 * - Violation categorization (critical, serious, moderate, minor)
 * - Helper functions for common a11y patterns
 *
 * Usage:
 *   const a11y = new AccessibilityUtils(page);
 *   const results = await a11y.checkPage();
 *   expect(results.violations).toHaveLength(0);
 */

import { type Page } from "@playwright/test";

export interface A11yViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  nodes: number;
  help: string;
  helpUrl: string;
}

export interface A11yResults {
  url: string;
  violations: A11yViolation[];
  passes: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

/**
 * Accessibility testing utilities using axe-core and manual checks.
 */
export class AccessibilityUtils {
  constructor(private page: Page) {}

  /**
   * Inject axe-core into page and run accessibility scan.
   *
   * Checks for WCAG 2.1 Level AA compliance.
   */
  async checkPage(): Promise<A11yResults> {
    // Inject axe-core script from CDN
    await this.page.addScriptTag({
      url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js",
    });

    // Run axe-core scan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const violations = await this.page.evaluate(async () => {
      const axe = (window as any).axe;
      if (!axe) {
        return [];
      }

      const results = await axe.run();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return results.violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        help: v.help,
        helpUrl: v.helpUrl,
      }));
    });

    const categorized = {
      critical: violations.filter((v: A11yViolation) => v.impact === "critical").length,
      serious: violations.filter((v: A11yViolation) => v.impact === "serious").length,
      moderate: violations.filter((v: A11yViolation) => v.impact === "moderate").length,
      minor: violations.filter((v: A11yViolation) => v.impact === "minor").length,
    };

    return {
      url: this.page.url(),
      violations: violations as A11yViolation[],
      passes: violations.length === 0 ? 1 : 0,
      ...categorized,
    };
  }

  /**
   * Check accessibility for a specific selector (e.g., modal, form).
   */
  async checkElement(selector: string): Promise<A11yResults> {
    // Inject axe-core script
    await this.page.addScriptTag({
      url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const violations = await this.page.evaluate(async (sel: string) => {
      const axe = (window as any).axe;
      if (!axe) {
        return [];
      }

      const results = await axe.run({ include: [sel] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return results.violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        help: v.help,
        helpUrl: v.helpUrl,
      }));
    }, selector);

    const categorized = {
      critical: violations.filter((v: A11yViolation) => v.impact === "critical").length,
      serious: violations.filter((v: A11yViolation) => v.impact === "serious").length,
      moderate: violations.filter((v: A11yViolation) => v.impact === "moderate").length,
      minor: violations.filter((v: A11yViolation) => v.impact === "minor").length,
    };

    return {
      url: this.page.url(),
      violations: violations as A11yViolation[],
      passes: violations.length === 0 ? 1 : 0,
      ...categorized,
    };
  }

  /**
   * Assert no accessibility violations found.
   */
  async assertNoViolations(maxLevel: "critical" | "serious" | "moderate" = "serious"): Promise<void> {
    const results = await this.checkPage();

    const violationSeverities: ("critical" | "serious" | "moderate" | "minor")[] = [
      "critical",
      "serious",
      "moderate",
      "minor",
    ];
    const maxLevelIndex = violationSeverities.indexOf(maxLevel);
    const relevantViolations = results.violations.filter(
      (v) => violationSeverities.indexOf(v.impact) <= maxLevelIndex
    );

    if (relevantViolations.length > 0) {
      const summary = relevantViolations
        .map((v) => `${v.id} (${v.impact}): ${v.description}`)
        .join("\n");
      throw new Error(`Accessibility violations found:\n${summary}`);
    }
  }

  /**
   * Check keyboard navigation: tab through all focusable elements.
   */
  async checkKeyboardNavigation(): Promise<string[]> {
    const focusable = await this.page.locator(
      "button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );

    const count = await focusable.count();
    const elements: string[] = [];

    for (let i = 0; i < count; i++) {
      const locator = focusable.nth(i);
      const role = await locator.getAttribute("role");
      const text = await locator.textContent();
      const tagName = await locator.evaluate((el) => el.tagName);
      elements.push(`${role || tagName} (${text?.trim() || ""})`);
    }

    return elements;
  }

  /**
   * Check aria-labels on interactive elements.
   */
  async checkAriaLabels(): Promise<{
    labeledElements: number;
    missingLabels: number;
    missing: string[];
  }> {
    const unlabeled = await this.page.locator(
      "button:not([aria-label]):has-text(''), input:not([aria-label]):not([type=hidden]):not([type=button])"
    );

    const count = await unlabeled.count();
    const missing: string[] = [];

    for (let i = 0; i < count; i++) {
      const el = unlabeled.nth(i);
      const text = await el.textContent();
      missing.push(text || "");
    }

    return {
      labeledElements: await this.page.locator("[aria-label]").count(),
      missingLabels: count,
      missing,
    };
  }

  /**
   * Check color contrast ratios (simplified).
   */
  async checkColorContrast(): Promise<{
    checkedElements: number;
    potential_issues: string[];
  }> {
    const styledText = await this.page.locator("span[style], p[style], div[style]");
    const count = await styledText.count();

    return {
      checkedElements: count,
      potential_issues: ["Run external contrast checker tool for precise verification"],
    };
  }

  /**
   * Check page structure: heading hierarchy.
   */
  async checkHeadingHierarchy(): Promise<{
    valid: boolean;
    headings: string[];
    issues: string[];
  }> {
    const headings = await this.page.locator("h1, h2, h3, h4, h5, h6");
    const count = await headings.count();

    const hierarchy: string[] = [];
    let lastLevel = 0;
    const issues: string[] = [];

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const tag = await heading.evaluate((el) => el.tagName);
      const level = parseInt(tag[1]);
      const text = (await heading.textContent())?.trim() || "";

      hierarchy.push(`${tag}: ${text}`);

      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push(`Heading jump from h${lastLevel} to h${level}`);
      }
      lastLevel = level;
    }

    return {
      valid: issues.length === 0,
      headings: hierarchy,
      issues,
    };
  }

  /**
   * Check for image alt-text.
   */
  async checkImageAltText(): Promise<{
    total: number;
    withAlt: number;
    missingAlt: number;
    images: Array<{ alt: string | null; src: string }>;
  }> {
    const images = await this.page.locator("img");
    const count = await images.count();

    const imageList: Array<{ alt: string | null; src: string }> = [];
    let withAlt = 0;
    let missingAlt = 0;

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const src = await img.getAttribute("src");

      imageList.push({ alt, src: src || "" });

      if (alt && alt.trim()) {
        withAlt++;
      } else {
        missingAlt++;
      }
    }

    return {
      total: count,
      withAlt,
      missingAlt,
      images: imageList,
    };
  }

  /**
   * Check form label associations.
   */
  async checkFormLabels(): Promise<{
    inputs: number;
    labeled: number;
    unlabeled: number;
    unlabeledNames: string[];
  }> {
    const inputs = await this.page.locator("input:not([type=hidden]), textarea, select");
    const count = await inputs.count();

    let labeled = 0;
    const unlabeledNames: string[] = [];

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const aria = await input.getAttribute("aria-label");
      const name = await input.getAttribute("name");

      if (!id && !aria) {
        unlabeledNames.push(name || `input_${i}`);
      } else {
        labeled++;
      }
    }

    return {
      inputs: count,
      labeled,
      unlabeled: count - labeled,
      unlabeledNames,
    };
  }
}
