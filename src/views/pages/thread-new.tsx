import { communityHue } from "../../lib/community-hue";
import { RULES } from "../../lib/validation";
import type { CommunityRecord } from "../../repositories/communities";
import { EmptyState } from "../components/common";
import { Field, Form, Select } from "../components/form";
import { Layout, PageHeader } from "../components/site";
import { errorList, type FormState } from "../form-state";

type Props = {
  user: string;
  communities: CommunityRecord[];
  /** 投稿先の初期値（`?c=`）。存在しない場合は未選択 */
  selectedId?: number;
  /** 400 の再描画 */
  state?: FormState;
};

/** スレッド作成ページ（`GET /t/new`）。ヘッダーの「投稿する」から開く */
export function ThreadNewPage({ user, communities, selectedId, state }: Props) {
  const selected = state?.values.community_id ?? (selectedId === undefined ? undefined : String(selectedId));
  const selectedCommunity = communities.find((c) => String(c.id) === selected);
  return (
    <Layout title="スレッドを立てる" user={user} postCommunityId={selectedCommunity?.id}>
      <PageHeader
        eyebrow="新しいスレッド"
        title="スレッドを立てる"
        description="投稿先のコミュニティを選び、タイトルと最初の投稿を書きます。"
        hue={selectedCommunity ? communityHue(selectedCommunity.id) : undefined}
      />
      <div class="page-grid">
        <section class="col-main" aria-label="スレッドを立てる">
          {communities.length === 0 ? (
            <EmptyState
              title="投稿先のコミュニティがありません"
              body="スレッドはコミュニティの中に立てます。まずコミュニティを作りましょう。"
              action={<a href="/c/new">コミュニティを作る</a>}
            />
          ) : (
            <Form
              action="/t"
              submitLabel="投稿する"
              panel
              errors={errorList(state)}
              extra={<a href={selectedCommunity ? `/c/${selectedCommunity.id}` : "/"}>キャンセル</a>}
            >
              <Select
                formId="new-thread"
                name="community_id"
                label="コミュニティ"
                required
                options={communities.map((c) => ({ value: String(c.id), label: c.name }))}
                value={selected}
                error={state?.errors.community_id}
              />
              <Field
                formId="new-thread"
                name="title"
                label="タイトル"
                max={RULES.threadTitle.max}
                required
                value={state?.values.title}
                error={state?.errors.title}
              />
              <Field
                formId="new-thread"
                name="body"
                label="本文"
                max={RULES.postBody.max}
                required
                multiline
                rows={8}
                value={state?.values.body}
                error={state?.errors.body}
              />
            </Form>
          )}
        </section>
      </div>
    </Layout>
  );
}
