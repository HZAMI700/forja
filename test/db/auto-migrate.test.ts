import { describe, it, expect, beforeEach } from "vitest";
import { ensureDbSchema, resetSchemaInitialized, SCHEMA_STATEMENTS } from "../../src/db/auto-migrate";

describe("ensureDbSchema", () => {
  beforeEach(() => {
    resetSchemaInitialized();
  });

  it("exports a non-empty list of schema statements", () => {
    expect(SCHEMA_STATEMENTS.length).toBeGreaterThan(20);
    expect(SCHEMA_STATEMENTS.some((s) => s.includes("CREATE TABLE IF NOT EXISTS settings"))).toBe(true);
    expect(SCHEMA_STATEMENTS.some((s) => s.includes("CREATE TABLE IF NOT EXISTS messages"))).toBe(true);
  });

  it("executes all statements when tables do not exist", async () => {
    const executed: string[] = [];
    let checkCalled = false;

    const mockD1 = {
      prepare: (sql: string) => ({
        bind: () => mockD1.prepare(sql),
        first: async () => {
          if (sql.includes("SELECT 1 FROM settings")) {
            checkCalled = true;
            throw new Error("no such table: settings");
          }
          return null;
        },
        run: async () => {
          executed.push(sql);
          return {};
        },
      }),
      exec: async (sql: string) => {
        executed.push(sql);
        return { count: 1, duration: 1 };
      },
    } as any;

    await ensureDbSchema(mockD1);

    expect(checkCalled).toBe(true);
    expect(executed.length).toBe(SCHEMA_STATEMENTS.length);

    // Second call should return early without executing again
    executed.length = 0;
    await ensureDbSchema(mockD1);
    expect(executed.length).toBe(0);
  });

  it("skips statement execution if settings table already exists", async () => {
    const executed: string[] = [];

    const mockD1 = {
      prepare: (sql: string) => ({
        bind: () => mockD1.prepare(sql),
        first: async () => {
          if (sql.includes("SELECT 1 FROM settings")) {
            return { 1: 1 };
          }
          return null;
        },
        run: async () => {
          executed.push(sql);
          return {};
        },
      }),
      exec: async (sql: string) => {
        executed.push(sql);
        return { count: 1, duration: 1 };
      },
    } as any;

    await ensureDbSchema(mockD1);

    expect(executed.length).toBe(0);
  });

  it("does not throw even if a statement produces a warning/error", async () => {
    const mockD1 = {
      prepare: () => ({
        bind: () => mockD1.prepare(""),
        first: async () => {
          throw new Error("no such table: settings");
        },
        run: async () => {},
      }),
      exec: async () => {
        throw new Error("d1 execute failure simulation");
      },
    } as any;

    await expect(ensureDbSchema(mockD1)).resolves.not.toThrow();
  });
});
