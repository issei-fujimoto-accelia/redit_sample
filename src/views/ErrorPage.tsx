import { Layout } from "./components/site";

export type ErrorStatus = 403 | 404 | 500 | 503;

const MESSAGES: Record<ErrorStatus, { title: string; body: string }> = {
  403: {
    title: "アクセスできません",
    body: "このページを表示・操作する権限がないか、ログイン情報を確認できませんでした。",
  },
  404: {
    title: "ページが見つかりません",
    body: "お探しのコミュニティやスレッドは削除されたか、URL が間違っている可能性があります。",
  },
  500: {
    title: "エラーが発生しました",
    body: "処理中に問題が発生しました。時間をおいて、もう一度お試しください。",
  },
  503: {
    title: "一時的に利用できません",
    body: "本日の利用上限に達した可能性があります。上限は毎日 9:00（JST）に戻ります。時間をおいて、もう一度お試しください。",
  },
};

export function ErrorPage({ status, user }: { status: ErrorStatus; user?: string }) {
  const m = MESSAGES[status];
  const code = String(status);
  return (
    <Layout title={m.title} user={user}>
      <section class="error-page" aria-labelledby="error-title">
        <p class="error-page__code" aria-hidden="true">
          {code.slice(0, 1)}
          <span>{code.slice(1, 2)}</span>
          {code.slice(2)}
        </p>
        <div class="error-page__text">
          <p class="visually-hidden">ステータス {code}</p>
          <h1 class="error-page__title" id="error-title">
            {m.title}
          </h1>
          <p class="error-page__body">{m.body}</p>
          <p class="error-page__links">
            <a class="button" href="/">
              ホームへ戻る
            </a>
            <a href="/c">コミュニティ一覧へ</a>
          </p>
        </div>
      </section>
    </Layout>
  );
}
