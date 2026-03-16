/**
 * API tests for Demoblaze product endpoints.
 *
 * Endpoints covered:
 *   POST /entries        — list all products.
 *   POST /bycat          — filter products by category.
 *   POST /view           — get single product by ID.
 */

import { test, expect } from "@playwright/test";

import { API_BASE_URL, PERF, loadTestData } from "./helpers";

const testData = loadTestData();

test.describe("Product API — Listings @api @products", () => {
  // Demoblaze API can be slow from CI runners; use a longer request timeout.
  test.use({ actionTimeout: 30_000 });

  test("POST /entries returns a non-empty product array with required fields", async ({
    request,
  }) => {
    const start = Date.now();

    const response = await request.get(`${API_BASE_URL}/entries`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(PERF.api_response_ms);

    const body = await response.json();
    expect(body).toHaveProperty("Items");
    expect(Array.isArray(body.Items)).toBe(true);
    expect(body.Items.length).toBeGreaterThan(0);

    // Validate schema of the first item
    const first = body.Items[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("price");
    expect(first).toHaveProperty("cat");
    expect(first).toHaveProperty("img");
  });

  test("POST /bycat 'phone' returns only phone-category products", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/bycat`, { data: { cat: "phone" } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("Items");
    expect(body.Items.length).toBeGreaterThan(0);

    for (const item of body.Items) {
      expect(item.cat).toBe("phone");
    }
  });

  test("POST /bycat 'notebook' returns only laptop-category products", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/bycat`, { data: { cat: "notebook" } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("Items");
    expect(body.Items.length).toBeGreaterThan(0);

    for (const item of body.Items) {
      expect(item.cat).toBe("notebook");
    }
  });

  test("POST /bycat 'monitor' returns only monitor-category products", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/bycat`, { data: { cat: "monitor" } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("Items");
    expect(body.Items.length).toBeGreaterThan(0);
  });
});

test.describe("Product API — View @api @products", () => {
  test.use({ actionTimeout: 30_000 });

  test("POST /view with a valid product ID returns full product details", async ({ request }) => {
    // First fetch a real product ID from /entries
    const listRes = await request.get(`${API_BASE_URL}/entries`);
    const listBody = await listRes.json();
    const productId: number = listBody.Items[0].id;

    const response = await request.post(`${API_BASE_URL}/view`, { data: { id: productId } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("id", productId);
    expect(body).toHaveProperty("title");
    expect(body).toHaveProperty("price");
    expect(body).toHaveProperty("desc");
    expect(body).toHaveProperty("img");
  });

  test("POST /view with an invalid product ID returns error message", async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/view`, { data: { id: 9_999_999 } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("errorMessage");
    expect(body.errorMessage.toLowerCase()).toContain("not found");
  });

  // Data-driven: verify known products exist in the catalogue
  const knownProducts = [testData.products.phone, testData.products.laptop];

  for (const product of knownProducts) {
    test(`/entries contains expected product: "${product.name}"`, async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/bycat`, {
        data: { cat: product.category },
      });

      const body = await response.json();
      const names: string[] = body.Items.map((i: { title: string }) => i.title);
      expect(names).toContain(product.name);
    });
  }
});

test.describe("Product API — Performance @api @performance", () => {
  test.use({ actionTimeout: 30_000 });
  // Skip in CI: Demoblaze API latency from GitHub Actions runners is unpredictable
  // and consistently exceeds the SLA thresholds — these tests are meaningful locally.
  test.beforeEach(() => {
    test.skip(!!process.env.CI, "Demoblaze API latency from CI runners is unpredictable");
  });

  test("/entries responds within 3000ms", async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/entries`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(PERF.api_response_ms);
  });

  const endpoints = [
    { name: "/bycat phone", path: "/bycat", body: { cat: "phone" } },
    { name: "/bycat notebook", path: "/bycat", body: { cat: "notebook" } },
  ];

  for (const ep of endpoints) {
    test(`${ep.name} responds within ${PERF.api_response_ms}ms`, async ({ request }) => {
      const start = Date.now();
      const response = await request.post(`${API_BASE_URL}${ep.path}`, { data: ep.body });
      const elapsed = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(elapsed).toBeLessThan(PERF.api_response_ms);
    });
  }
});
