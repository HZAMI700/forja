import { describe, it, expect } from "vitest";
import { checkBasicCredentials, ADMIN_USERNAME } from "../../src/admin/auth";
import type { Env } from "../../src/env";

const env = { DASHBOARD_PASSWORD: "secret123" } as unknown as Env;

/** base64("admin:secret123") === "YWRtaW46c2VjcmV0MTIz" */
const validHeader = "Basic YWRtaW46c2VjcmV0MTIz";

describe("checkBasicCredentials", () => {
  it("accepts the correct admin:secret123 header", () => {
    expect(checkBasicCredentials(validHeader, env)).toBe(true);
  });

  it("is case-insensitive on the Basic scheme keyword", () => {
    expect(checkBasicCredentials("basic YWRtaW46c2VjcmV0MTIz", env)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const header = `Basic ${btoa(`${ADMIN_USERNAME}:wrongpass`)}`;
    expect(checkBasicCredentials(header, env)).toBe(false);
  });

  it("rejects a wrong username", () => {
    const header = `Basic ${btoa("root:secret123")}`;
    expect(checkBasicCredentials(header, env)).toBe(false);
  });

  it("rejects an absent header", () => {
    expect(checkBasicCredentials(undefined, env)).toBe(false);
    expect(checkBasicCredentials(null, env)).toBe(false);
    expect(checkBasicCredentials("", env)).toBe(false);
  });

  it("rejects a malformed header (no Basic scheme)", () => {
    expect(checkBasicCredentials("Bearer YWRtaW46c2VjcmV0MTIz", env)).toBe(false);
    expect(checkBasicCredentials("YWRtaW46c2VjcmV0MTIz", env)).toBe(false);
  });

  it("rejects a payload that decodes without a colon separator", () => {
    const header = `Basic ${btoa("adminsecret123")}`;
    expect(checkBasicCredentials(header, env)).toBe(false);
  });

  it("uses the FIRST colon so passwords containing colons still work", () => {
    const colonEnv = { DASHBOARD_PASSWORD: "a:b:c" } as unknown as Env;
    const header = `Basic ${btoa("admin:a:b:c")}`;
    expect(checkBasicCredentials(header, colonEnv)).toBe(true);
  });

  describe("default admin / admin credentials", () => {
    const defaultEnv = {} as unknown as Env;
    const adminAdminHeader = `Basic ${btoa("admin:admin")}`;

    it("accepts admin / admin when DASHBOARD_PASSWORD is unset", () => {
      expect(checkBasicCredentials(adminAdminHeader, defaultEnv)).toBe(true);
    });

    it("accepts admin / admin when DASHBOARD_PASSWORD is 'admin'", () => {
      const explicitEnv = { DASHBOARD_PASSWORD: "admin" } as unknown as Env;
      expect(checkBasicCredentials(adminAdminHeader, explicitEnv)).toBe(true);
    });

    it("rejects wrong username with admin password", () => {
      const wrongUserHeader = `Basic ${btoa("wronguser:admin")}`;
      expect(checkBasicCredentials(wrongUserHeader, defaultEnv)).toBe(false);
    });

    it("rejects wrong password with admin username", () => {
      const wrongPassHeader = `Basic ${btoa("admin:wrongpassword")}`;
      expect(checkBasicCredentials(wrongPassHeader, defaultEnv)).toBe(false);
    });
  });
});

import { Hono } from "hono";
import { adminAuth } from "../../src/admin/auth";

describe("adminAuth middleware HTTP behavior", () => {
  function makeApp(testEnv: any = {}) {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", (c, next) => adminAuth(testEnv)(c, next));
    app.get("/admin/test", (c) => c.text("authorized"));
    return app;
  }

  it("admin / admin → successful (200)", async () => {
    const app = makeApp();
    const res = await app.request("/admin/test", {
      headers: { Authorization: `Basic ${btoa("admin:admin")}` },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("authorized");
  });

  it("wrong username → rejected (401)", async () => {
    const app = makeApp();
    const res = await app.request("/admin/test", {
      headers: { Authorization: `Basic ${btoa("wronguser:admin")}` },
    });
    expect(res.status).toBe(401);
  });

  it("wrong password → rejected (401)", async () => {
    const app = makeApp();
    const res = await app.request("/admin/test", {
      headers: { Authorization: `Basic ${btoa("admin:wrongpassword")}` },
    });
    expect(res.status).toBe(401);
  });
});
