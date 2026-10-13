import { expect, it } from "vitest";
import { displayName } from "../../src/lib/display-name";

it("メールアドレスの @ より前を返す", () => {
  expect(displayName("alice@example.com")).toBe("alice");
});

it("ドットや記号を含むローカル部もそのまま返す", () => {
  expect(displayName("bob.smith+tag@example.co.jp")).toBe("bob.smith+tag");
});
