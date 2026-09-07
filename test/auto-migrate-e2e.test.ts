import { describe, it, expect, vi } from "vitest";

vi.mock("agents", () => ({ Agent: class {} }));

import worker from "../src/index";
import { Miniflare } from "miniflare";
import { resetSchemaInitialized } from "../src/db/auto-migrate";

describe("Auto-migration on clean D1 database", () => {
  it("automatically creates tables on first request and serves /admin/overview with 200 OK", async () => {
    resetSchemaInitialized();

    const mf = new Miniflare({
      modules: [{ type: "ESModule", path: "index.js", contents: "export default { fetch() { return new Response('ok'); } };" }],
      d1Databases: ["DB"],
      compatibilityDate: "2026-05-01",
      compatibilityFlags: ["nodejs_compat"],
    });

    const d1 = await mf.getD1Database("DB");

    // Before any request, confirm settings table does NOT exist
    await expect(d1.prepare("SELECT 1 FROM settings LIMIT 1").first()).rejects.toThrow();

    const env = {
      DB: d1,
      BOT_NAME: "Forja Bot",
      BUSINESS_NAME: "Forja Test",
      BOT_LANGUAGE: "es",
      BOT_TIER: "pro",
      BUFFER_SECONDS: "15",
      DASHBOARD_PASSWORD: "admin",
      ADMIN_USERNAME: "admin",
      DASHBOARD_BASE_URL: "https://test.workers.dev",
    };

    const authHeader = "Basic " + Buffer.from("admin:admin").toString("base64");

    const req = new Request("https://test/admin/overview", {
      headers: {
        Authorization: authHeader,
        Accept: "text/html",
      },
    });

    const res = await worker.fetch(req, env as any, {} as any);
    expect(res.status).toBe(200);

    const body = await res.text();
    expect(body).toContain("Overview");
    expect(body).toContain("Estado del agente");

    // After request, settings and messages tables exist
    const settingsCheck = await d1.prepare("SELECT 1 FROM settings LIMIT 1").first();
    expect(settingsCheck).toBeDefined();

    const messagesCheck = await d1.prepare("SELECT COUNT(*) as n FROM messages").first();
    expect(messagesCheck).toEqual({ n: 0 });

    // Test GET / redirects to /admin
    const rootRes = await worker.fetch(new Request("https://test/"), env as any, {} as any);
    expect(rootRes.status).toBe(302);
    expect(rootRes.headers.get("location")).toBe("/admin");

    // Test GET /admin redirects to /admin/overview
    const adminRes = await worker.fetch(
      new Request("https://test/admin", { headers: { Authorization: authHeader } }),
      env as any,
      {} as any,
    );
    expect(adminRes.status).toBe(302);
    expect(adminRes.headers.get("location")).toBe("/admin/overview");

    // Test GET /admin/overview without auth returns 401
    const noAuthRes = await worker.fetch(new Request("https://test/admin/overview"), env as any, {} as any);
    expect(noAuthRes.status).toBe(401);

    // Test GET /admin/overview with wrong credentials returns 401
    const badAuthHeader = "Basic " + Buffer.from("admin:wrongpass").toString("base64");
    const badAuthRes = await worker.fetch(
      new Request("https://test/admin/overview", { headers: { Authorization: badAuthHeader } }),
      env as any,
      {} as any,
    );
    expect(badAuthRes.status).toBe(401);

    await mf.dispose();
  });

  it("serves the platform in English by default when BOT_LANGUAGE is 'en' or unset", async () => {
    resetSchemaInitialized();

    const mf = new Miniflare({
      modules: [{ type: "ESModule", path: "index.js", contents: "export default { fetch() { return new Response('ok'); } };" }],
      d1Databases: ["DB"],
      compatibilityDate: "2026-05-01",
      compatibilityFlags: ["nodejs_compat"],
    });

    const d1 = await mf.getD1Database("DB");

    const env = {
      DB: d1,
      BOT_NAME: "Forja Bot",
      BUSINESS_NAME: "Forja",
      BOT_LANGUAGE: "en",
      BOT_TIER: "pro",
      BUFFER_SECONDS: "15",
      DASHBOARD_PASSWORD: "admin",
      ADMIN_USERNAME: "admin",
      DASHBOARD_BASE_URL: "https://test.workers.dev",
    };

    const authHeader = "Basic " + Buffer.from("admin:admin").toString("base64");

    const req = new Request("https://test/admin/overview", {
      headers: {
        Authorization: authHeader,
        Accept: "text/html",
      },
    });

    const res = await worker.fetch(req, env as any, {} as any);
    expect(res.status).toBe(200);

    const body = await res.text();
    expect(body).toContain('<html lang="en">');
    expect(body).toContain("Agent Status");
    expect(body).toContain("MESSAGES TODAY");
    expect(body).toContain("BOT ONLINE");
    expect(body).toContain("Home / Overview");
    expect(body).toContain("Panel · Pro");
    expect(body).toContain("Active model");
    expect(body).toContain("Knowledge docs");

    await mf.dispose();
  });
});
