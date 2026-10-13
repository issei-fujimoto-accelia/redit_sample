/** 400／409 の再描画に使う、フォームの入力値とエラー */
export type FormState = {
  values: Record<string, string>;
  errors: Record<string, string>;
};

export const errorList = (s?: FormState) => (s ? Object.values(s.errors) : []);
