import { describe, expect, it } from "vitest";
import { IDLE_MS, MAX_WAIT_MS, MIN_GAP_MS, nextSaveAt } from "../autosave";

describe("autosave pacing", () => {
  it("saves after a pause in typing", () => {
    expect(nextSaveAt(100_000, 100_000, 0, 0)).toBe(100_000 + IDLE_MS);
  });

  it("still saves during non-stop typing, at most MAX_WAIT after the first unsaved change", () => {
    expect(nextSaveAt(128_000, 100_000, 0, 0)).toBe(100_000 + MAX_WAIT_MS);
  });

  it("never saves more often than MIN_GAP", () => {
    expect(nextSaveAt(100_000, 100_000, 95_000, 0)).toBe(95_000 + MIN_GAP_MS);
  });

  it("respects backoff after a refusal", () => {
    expect(nextSaveAt(100_000, 100_000, 0, 160_000)).toBe(160_000);
  });

  it("stays under GitHub's 500 writes/hour even typing for an hour straight", () => {
    expect(3_600_000 / MIN_GAP_MS).toBeLessThanOrEqual(240);
  });
});
