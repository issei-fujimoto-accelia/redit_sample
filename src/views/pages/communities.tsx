import { communityHue } from "../../lib/community-hue";
import { displayName } from "../../lib/display-name";
import { RULES } from "../../lib/validation";
import type { CommunityRecord } from "../../repositories/communities";
import { CommunityGrid } from "../components/community";
import { EmptyState, MarginNote, Timestamp } from "../components/common";
import { Field, Form } from "../components/form";
import { Layout, PageHeader } from "../components/site";
import { ThreadList } from "../components/thread";
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

type ListProps = { user: string; communities: CommunityRecord[]; create?: FormState };

export function CommunityListPage({ user, communities, create }: ListProps) {
  return (
    <Layout title="コミュニティ" user={user} current="communities">
      <PageHeader
        eyebrow={
          <>
            <span class="num latin">{communities.length}</span> のコミュニティ
          </>
        }
        title="コミュニティ"
        description="テーマごとの議論の場。気になる場所を開いて、スレッドを読んだり立てたりできます。"
      />
      <div class="page-grid">
        <section class="col-full" aria-labelledby="community-list-title">
          <h2 id="community-list-title" class="visually-hidden">
            コミュニティ一覧
          </h2>
          {communities.length === 0 ? (
            <EmptyState title="コミュニティはまだありません" body="最初のコミュニティを作って、議論の場を開きましょう。" />
          ) : (
            <CommunityGrid communities={communities} />
          )}
        </section>
        <section class="col-main" id="new-community" aria-label="コミュニティを作る">
          <Form action="/c" title="コミュニティを作る" submitLabel="作成する" panel errors={errorList(create)}>
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
};

export function CommunityPage({ user, community: c }: PageProps) {
  return (
    <Layout title={c.name} user={user} current="communities">
      <PageHeader
        eyebrow={<a href="/c">コミュニティ</a>}
        title={c.name}
        description={c.description || undefined}
        hue={communityHue(c.id)}
      />
      <div class="page-grid" style={`--community-hue: ${communityHue(c.id)}`}>
        <div class="col-margin">
          <MarginNote
            title="このコミュニティについて"
            items={[
              { label: "作成者", value: displayName(c.author_email) },
              { label: "作成", value: <Timestamp iso={c.created_at} /> },
            ]}
          />
        </div>
        <section class="col-main" aria-labelledby="threads-title">
          <h2 id="threads-title" class="section-title">
            スレッド
          </h2>
          <ThreadList
            threads={[]}
            showCommunity={false}
            page={1}
            hasNext={false}
            baseUrl={`/c/${c.id}`}
            emptyBody="最初のスレッドを立てて、議論を始めましょう。"
          />
        </section>
      </div>
    </Layout>
  );
}
