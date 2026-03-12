/**
 * API tests for Demoblaze cart and order endpoints.
 *
 * Endpoints covered:
 *   POST /viewcart   — list items in a user's cart.
 *   POST /addtocart  — add an item to the cart.
 *   POST /deletecart — remove a specific cart entry.
 *   POST /placeorder — submit an order.
 */

import { test, expect } from "@playwright/test";

import { API_BASE_URL, PERF, getTestUser, getCheckoutData } from "./helpers";

const user = getTestUser();

test.describe("Cart API — View @api @cart", () => {
  test.skip(!user.username || user.username.startsWith("$"), "TEST_USERNAME not set in .env");

  test("POST /viewcart returns Items array for authenticated user", async ({ request }) => {
    const start = Date.now();

    const response = await request.post(`${API_BASE_URL}/viewcart`, {
      data: { cookie: user.username, flag: true },
    });
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(PERF.cart_update_ms);

    const body = await response.json();
    expect(body).toHaveProperty("Items");
  });
});

test.describe("Cart API — Add & Delete @api @cart", () => {
  test.skip(!user.username || user.username.startsWith("$"), "TEST_USERNAME not set in .env");

  test("POST /addtocart adds a product and returns 200", async ({ request }) => {
    // Fetch a real product ID first
    const listRes = await request.post(`${API_BASE_URL}/entries`, { data: {} });
    const listBody = await listRes.json();
    const productId: number = listBody.Items[0].id;

    const cartEntryId = `api_add_${Date.now()}`;
    const start = Date.now();

    const response = await request.post(`${API_BASE_URL}/addtocart`, {
      data: {
        id: cartEntryId,
        cookie: user.username,
        prod_id: productId,
        flag: true,
      },
    });
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(PERF.cart_update_ms);
  });

  test("POST /deletecart removes a previously added entry", async ({ request }) => {
    // Add first
    const listRes = await request.post(`${API_BASE_URL}/entries`, { data: {} });
    const listBody = await listRes.json();
    const productId: number = listBody.Items[0].id;
    const cartEntryId = `api_del_${Date.now()}`;

    await request.post(`${API_BASE_URL}/addtocart`, {
      data: { id: cartEntryId, cookie: user.username, prod_id: productId, flag: true },
    });

    // Now delete
    const response = await request.post(`${API_BASE_URL}/deletecart`, {
      data: { id: cartEntryId },
    });

    expect(response.status()).toBe(200);
  });
});

test.describe("Cart API — Place Order @api @cart", () => {
  test.skip(!user.username || user.username.startsWith("$"), "TEST_USERNAME not set in .env");

  test("POST /placeorder with valid data returns 200", async ({ request }) => {
    const checkout = getCheckoutData();

    const response = await request.post(`${API_BASE_URL}/placeorder`, {
      data: {
        name: checkout.name || "API Test User",
        country: checkout.country || "United Kingdom",
        city: checkout.city || "London",
        card: checkout.card || "4111111111111111",
        month: checkout.month || "12",
        year: checkout.year || "2027",
        cookie: user.username,
      },
    });

    expect(response.status()).toBe(200);
  });
});
