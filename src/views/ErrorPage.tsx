import { Layout } from "./Layout";

export type ErrorStatus = 403 | 404 | 500 | 503;

const MESSAGES: Record<ErrorStatus, { title: string; body: string }> = {
  403: { title: "アクセスできません", body: "このページを表示する権限がないか、ログイン情報を確認できませんでした。" },
  404: { title: "ページが見つかりません", body: "お探しのページは削除されたか、URL が間違っている可能性があります。" },
  500: { title: "エラーが発生しました", body: "処理中に問題が発生しました。時間をおいて再度お試しください。" },
  503: { title: "一時的に利用できません", body: "利用上限に達した可能性があります。時間をおいて再度お試しください。" },
};

export function ErrorPage({ status, user }: { status: ErrorStatus; user?: string }) {
  const m = MESSAGES[status];
  return (
    <Layout title={m.title} user={user}>
      <p>{status}</p>
      <h1>{m.title}</h1>
      <p>{m.body}</p>
      <p>
        <a href="/">ホームへ戻る</a>
      </p>
    </Layout>
  );
}
