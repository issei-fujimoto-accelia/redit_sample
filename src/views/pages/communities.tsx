import { communityHue } from "../../lib/community-hue";
import { displayName } from "../../lib/display-name";
import { RULES } from "../../lib/validation";
import type { CommunityRecord } from "../../repositories/communities";
import { CommunityGrid } from "../components/community";
import { Edited, EmptyState, MarginNote, Notice, Timestamp } from "../components/common";
import { Field, Form, OwnerActions } from "../components/form";
import { Layout, PageHeader } from "../components/site";
import { ThreadList, toThreadRow } from "../components/thread";
import type { ThreadPage } from "../../services/threads";
import { errorList, type FormState } from "../form-state";

function CommunityFields({ formId, state }: { formId: string; state?: FormState }) {
  return (
    <>
      <Field
        formId={formId}
        name="name"
        label="名前"
        max={RULES.communityName.max}
        required
        value={state?.values.name}
        error={state?.errors.name}
      />
      <Field
        formId={formId}
        name="description"
        label="説明"
        max={RULES.communityDescription.max}
        multiline
        rows={3}
        value={state?.values.description}
        error={state?.errors.description}
      />
    </>
  );
}

type ListProps = { user: string; communities: CommunityRecord[] };

export function CommunityListPage({ user, communities }: ListProps) {
  return (
    <Layout title="コミュニティ" user={user} current="communities">
      <PageHeader
        eyebrow={
          <>
            <span class="num latin">{communities.length}</span> つのコミュニティ
          </>
        }
        title={
          <>
            コミュニティ <span class="latin">Communities</span>
          </>
        }
        description="テーマごとの議論の場。気になる場所を開いて、スレッドを読んだり立てたりできます。"
        actions={
          <a class="button" href="/c/new">
            コミュニティを作る
          </a>
        }
      />
      <div class="page-grid">
        <section class="col-full" aria-labelledby="community-list-title">
          <h2 id="community-list-title" class="visually-hidden">
            コミュニティ一覧
          </h2>
          {communities.length === 0 ? (
            <EmptyState
              title="コミュニティはまだありません"
              body="最初のコミュニティを作って、議論の場を開きましょう。"
              action={<a href="/c/new">コミュニティを作る</a>}
            />
          ) : (
            <CommunityGrid communities={communities} />
          )}
        </section>
      </div>
    </Layout>
  );
}

/** コミュニティ作成ページ（`GET /c/new`）。400／409 の再描画にも使う */
export function CommunityNewPage({ user, create }: { user: string; create?: FormState }) {
  return (
    <Layout title="コミュニティを作る" user={user} current="in-communities">
      <PageHeader
        eyebrow={<a href="/c">コミュニティ</a>}
        title="コミュニティを作る"
        description="テーマを決めて、議論の場を開きます。名前はあとから変更できます。"
      />
      <div class="page-grid">
        <section class="col-main" aria-label="コミュニティを作る">
          <Form action="/c" submitLabel="作成する" panel errors={errorList(create)} extra={<a href="/c">キャンセル</a>}>
            <CommunityFields formId="new-community" state={create} />
          </Form>
        </section>
      </div>
    </Layout>
  );
}

type PageProps = {
  user: string;
  community: CommunityRecord;
  list: ThreadPage;
  /** 修正の 400／409 */
  edit?: FormState;
  /** 削除できない理由（409） */
  deleteError?: string;
  /** スレッド作成の 400 */
  newThread?: FormState;
};

export function CommunityPage({ user, community: c, list, edit, deleteError, newThread }: PageProps) {
  const isOwner = c.author_email === user;
  const editState: FormState = edit ?? { values: { name: c.name, description: c.description }, errors: {} };
  return (
    <Layout title={c.name} user={user} current="communities">
      <PageHeader
        eyebrow={<a href="/c">コミュニティ</a>}
        title={c.name}
        description={c.description || undefined}
        hue={communityHue(c.id)}
        actions={
          <OwnerActions
            isOwner={isOwner}
            editOpen={edit !== undefined}
            editLabel="コミュニティを編集"
            edit={
              <Form action={`/c/${c.id}/edit`} submitLabel="保存する" errors={errorList(edit)}>
                <CommunityFields formId="edit-community" state={editState} />
              </Form>
            }
            deleteAction={`/c/${c.id}/delete`}
            deleteConfirm={`コミュニティ「${c.name}」を削除しますか？この操作は取り消せません。`}
          />
        }
      />
      {deleteError && (
        <div class="page-notice">
          <Notice tone="error" title="このコミュニティは削除できません">
            {deleteError}
          </Notice>
        </div>
      )}
      <div class="page-grid" style={`--community-hue: ${communityHue(c.id)}`}>
        <div class="col-margin">
          <MarginNote
            title="このコミュニティについて"
            items={[
              { label: "作成者", value: displayName(c.author_email) },
              { label: "作成", value: <Timestamp iso={c.created_at} /> },
              ...(c.updated_at ? [{ label: "更新", value: <><Timestamp iso={c.updated_at} /> <Edited updatedAt={c.updated_at} /></> }] : []),
            ]}
          />
        </div>
        <section class="col-main" aria-labelledby="threads-title">
          <h2 id="threads-title" class="section-title">
            スレッド
            {list.page > 1 && <span class="num">{list.page} ページ目</span>}
          </h2>
          <ThreadList
            threads={list.threads.map(toThreadRow)}
            showCommunity={false}
            page={list.page}
            hasNext={list.hasNext}
            baseUrl={`/c/${c.id}`}
            emptyBody="下のフォームから最初のスレッドを立てて、議論を始めましょう。"
          />
        </section>
        <section class="col-main" id="new-thread" aria-label="スレッドを立てる">
          <Form action={`/c/${c.id}/threads`} title="スレッドを立てる" submitLabel="投稿する" panel errors={errorList(newThread)}>
            <Field
              formId="new-thread"
              name="title"
              label="タイトル"
              max={RULES.threadTitle.max}
              required
              value={newThread?.values.title}
              error={newThread?.errors.title}
            />
            <Field
              formId="new-thread"
              name="body"
              label="本文"
              max={RULES.postBody.max}
              required
              multiline
              rows={6}
              value={newThread?.values.body}
              error={newThread?.errors.body}
            />
          </Form>
        </section>
      </div>
    </Layout>
  );
}
