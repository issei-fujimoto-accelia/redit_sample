/** 入力項目の制約（REQUIREMENTS §6.2） */
export type FieldRule = {
  label: string;
  required: boolean;
  max: number;
};

export const RULES = {
  communityName: { label: "コミュニティ名", required: true, max: 50 },
  communityDescription: { label: "説明", required: false, max: 500 },
  threadTitle: { label: "タイトル", required: true, max: 200 },
  postBody: { label: "本文", required: true, max: 10_000 },
} as const satisfies Record<string, FieldRule>;

export type FieldResult = { ok: true; value: string } | { ok: false; value: string; error: string };

/** 文字数（コードポイント単位）。サロゲートペアを1文字として数える */
function length(s: string): number {
  return [...s].length;
}

/**
 * 前後の空白を除いた値で必須・上限を判定する。
 * 成功時の value は trim 後の値、失敗時の value は再描画用の元の入力値。
 */
export function validateField(input: unknown, rule: FieldRule): FieldResult {
  const raw = typeof input === "string" ? input : "";
  const value = raw.trim();
  if (rule.required && value === "") {
    return { ok: false, value: raw, error: `${rule.label}を入力してください。` };
  }
  if (length(value) > rule.max) {
    return {
      ok: false,
      value: raw,
      error: `${rule.label}は${rule.max.toLocaleString("en-US")}文字以内で入力してください。`,
    };
  }
  return { ok: true, value };
}
