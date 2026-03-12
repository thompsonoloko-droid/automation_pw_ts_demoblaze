/**
 * API testing utilities for the Demoblaze REST API.
 *
 * Wraps Playwright's APIRequestContext with typed helpers for
 * the api.demoblaze.com endpoints.
 *
 * Note: Demoblaze always returns HTTP 200 — success/failure is
 * indicated by the response body, not the status code.
 */

import { type APIRequestContext, type APIResponse } from "@playwright/test";

export const DEMOBLAZE_API_BASE = "https://api.demoblaze.com";

export class ApiUtils {
  constructor(
    private request: APIRequestContext,
    private baseUrl: string = DEMOBLAZE_API_BASE,
  ) {}

  /**
   * POST to a Demoblaze API endpoint with a JSON body.
   *
   * @param endpoint - Path starting with "/" (e.g. "/login").
   * @param data     - JSON-serialisable request body.
   */
  async post(endpoint: string, data: Record<string, unknown> = {}): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}${endpoint}`, { data });
  }

  /**
   * POST and immediately parse the response as JSON.
   *
   * @param endpoint - Path starting with "/".
   * @param data     - JSON-serialisable request body.
   */
  async postJson<T = unknown>(endpoint: string, data: Record<string, unknown> = {}): Promise<T> {
    const response = await this.post(endpoint, data);
    return response.json() as Promise<T>;
  }

  /**
   * POST and return the raw response text.
   *
   * Useful for endpoints that return plain strings (e.g. auth token).
   *
   * @param endpoint - Path starting with "/".
   * @param data     - JSON-serialisable request body.
   */
  async postText(endpoint: string, data: Record<string, unknown> = {}): Promise<string> {
    const response = await this.post(endpoint, data);
    return response.text();
  }

  /**
   * GET to a Demoblaze API endpoint.
   *
   * @param endpoint - Path starting with "/" (e.g. "/entries").
   */
  async get(endpoint: string): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}${endpoint}`);
  }

  /**
   * GET and immediately parse the response as JSON.
   *
   * @param endpoint - Path starting with "/".
   */
  async getJson<T = unknown>(endpoint: string): Promise<T> {
    const response = await this.get(endpoint);
    return response.json() as Promise<T>;
  }

  /**
   * GET and return the raw response text.
   *
   * @param endpoint - Path starting with "/".
   */
  async getText(endpoint: string): Promise<string> {
    const response = await this.get(endpoint);
    return response.text();
  }
}
