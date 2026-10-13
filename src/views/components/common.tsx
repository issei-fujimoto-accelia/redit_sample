import type { Child } from "hono/jsx";
import { formatJst } from "../../lib/time";

/** `<time datetime="UTC">` と JST 表示 */
export function Timestamp({ iso, prefix }: { iso: string; prefix?: string }) {
  return (
    <time datetime={iso}>
      {prefix}
      {formatJst(iso)}
    </time>
  );
}

export function Edited({ updatedAt }: { updatedAt?: string | null }) {
  if (!updatedAt) return null;
  return (
    <span class="edited" title={`編集：${formatJst(updatedAt)}`}>
      編集済み
    </span>
  );
}

type NoticeProps = {
  tone?: "info" | "error";
  title: string;
  children?: Child;
};

/** 削除できない理由（409）などの通知 */
export function Notice({ tone = "info", title, children }: NoticeProps) {
  return (
    <div class={`notice notice--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <p class="notice__title">{title}</p>
      {children && <div>{children}</div>}
    </div>
  );
}

/** 400／409 の理由をフォームの先頭にまとめる */
export function FormErrorSummary({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div class="notice notice--error" role="alert">
      <p class="notice__title">入力内容を確認してください</p>
      <ul>
        {errors.map((e) => (
          <li>{e}</li>
        ))}
      </ul>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  body?: string;
  action?: Child;
};

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div class="empty">
      <span class="empty__mark" aria-hidden="true">
        ¶
      </span>
      <p class="empty__title">{title}</p>
      {body && <p class="empty__body">{body}</p>}
      {action}
    </div>
  );
}
