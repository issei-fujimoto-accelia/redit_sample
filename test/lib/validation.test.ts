import { describe, expect, it } from "vitest";
import { RULES, validateField } from "../../src/lib/validation";

const cases = [
  { name: "コミュニティ名", rule: RULES.communityName, max: 50, maxLabel: "50", required: true },
  { name: "コミュニティ説明", rule: RULES.communityDescription, max: 500, maxLabel: "500", required: false },
  { name: "スレッドタイトル", rule: RULES.threadTitle, max: 200, maxLabel: "200", required: true },
  { name: "投稿本文", rule: RULES.postBody, max: 10000, maxLabel: "10,000", required: true },
] as const;

describe.each(cases)("$name", ({ rule, max, maxLabel, required }) => {
  it("上限ちょうどは有効", () => {
    expect(validateField("あ".repeat(max), rule)).toEqual({ ok: true, value: "あ".repeat(max) });
  });

  it("上限＋1は無効", () => {
    const r = validateField("あ".repeat(max + 1), rule);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(`${maxLabel}文字以内`);
  });

  it("前後の空白を含めると上限超だが、trim 後は上限内なら有効で、値は trim される", () => {
    expect(validateField(`  ${"a".repeat(max)}\n `, rule)).toEqual({ ok: true, value: "a".repeat(max) });
  });

  if (required) {
    it("空は無効", () => {
      const r = validateField("", rule);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("入力してください");
    });

    it("空白のみは無効", () => {
      expect(validateField(" 　\n\t ", rule).ok).toBe(false);
    });
  } else {
    it("空でも有効", () => {
      expect(validateField("", rule)).toEqual({ ok: true, value: "" });
    });

    it("空白のみは空として有効", () => {
      expect(validateField("   ", rule)).toEqual({ ok: true, value: "" });
    });
  }
});

describe("入力値の型", () => {
  it("未指定（undefined）は空として扱う", () => {
    expect(validateField(undefined, RULES.communityName).ok).toBe(false);
    expect(validateField(undefined, RULES.communityDescription)).toEqual({ ok: true, value: "" });
  });

  it("サロゲートペアの文字は1文字として数える", () => {
    expect(validateField("😀".repeat(50), RULES.communityName).ok).toBe(true);
    expect(validateField("😀".repeat(51), RULES.communityName).ok).toBe(false);
  });
});
