import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-that-is-at-least-32-characters-long";
});

describe("sealed session cookies", () => {
  it("round-trips data", async () => {
    const { seal, unseal } = await import("../session");
    const value = await seal({ token: "gho_abc", login: "octocat" });
    expect(value).not.toContain("gho_abc");
    expect(await unseal(value)).toEqual({ token: "gho_abc", login: "octocat" });
  });

  it("rejects tampered or garbage values", async () => {
    const { seal, unseal } = await import("../session");
    const value = await seal({ token: "x" });
    const flipped = value.slice(0, -2) + (value.endsWith("A") ? "B" : "A") + value.slice(-1);
    expect(await unseal(flipped)).toBeNull();
    expect(await unseal("not-a-cookie")).toBeNull();
    expect(await unseal(undefined)).toBeNull();
  });

  it("uses a fresh IV every time", async () => {
    const { seal } = await import("../session");
    expect(await seal({ a: 1 })).not.toBe(await seal({ a: 1 }));
  });
});
