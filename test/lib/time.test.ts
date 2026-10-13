import { expect, it } from "vitest";
import { formatJst } from "../../src/lib/time";

it("UTC を JST の YYYY-MM-DD HH:mm で返す", () => {
  expect(formatJst("2026-01-01T00:00:00.000Z")).toBe("2026-01-01 09:00");
});

it("UTC 15:00 は JST の翌日 00:00", () => {
  expect(formatJst("2026-01-01T15:00:00.000Z")).toBe("2026-01-02 00:00");
});

it("年末をまたぐ", () => {
  expect(formatJst("2026-12-31T20:05:59.999Z")).toBe("2027-01-01 05:05");
});
