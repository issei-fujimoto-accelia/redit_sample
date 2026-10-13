import { describe, expect, it } from "vitest";
import { communityHue } from "../../src/lib/community-hue";

describe("communityHue", () => {
  it("同じ ID には常に同じ色相を返す", () => {
    expect(communityHue(42)).toBe(communityHue(42));
  });

  it("戻り値は 0 以上 359 以下の整数", () => {
    for (let id = 1; id <= 1000; id++) {
      const h = communityHue(id);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(359);
    }
  });

  it("隣り合う ID が近い色相にならない（黄金角で散らす）", () => {
    expect([1, 2, 3, 4].map(communityHue)).toEqual([138, 275, 53, 190]);
  });
});
