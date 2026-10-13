import { HTTPException } from "hono/http-exception";

/** 入力検証エラー（400）・競合（409）。元の画面を再描画するために、入力値とエラーを持つ */
export type FormFailure = {
  ok: false;
  status: 400 | 409;
  values: Record<string, string>;
  /** 項目ごとのエラー */
  errors: Record<string, string>;
};

export type ServiceResult<T> = { ok: true; value: T } | FormFailure;

export const notFound = () => new HTTPException(404, { message: "not found" });
export const forbidden = () => new HTTPException(403, { message: "forbidden" });

/** URL の ID を正の整数として解釈する。不正なら 404 */
export function parseId(raw: string | undefined): number {
  if (!raw || !/^[1-9]\d{0,15}$/.test(raw)) throw notFound();
  return Number(raw);
}
