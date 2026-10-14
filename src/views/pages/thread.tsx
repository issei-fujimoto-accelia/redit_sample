import { communityHue } from "../../lib/community-hue";
import { displayName } from "../../lib/display-name";
import type { PostRecord } from "../../repositories/posts";
import type { ThreadRecord } from "../../repositories/threads";
import { CommunityChip } from "../components/community";
import { Edited, MarginNote, Notice, Timestamp } from "../components/common";
import { Field, Form, OwnerActions } from "../components/form";
import { RULES } from "../../lib/validation";
import { errorList, type FormState } from "../form-state";
import { PostItem, PostList } from "../components/post";
import { Layout, PageHeader } from "../components/site";

type Props = {
  user: string;
  thread: ThreadRecord;
  posts: PostRecord[];
  /** タイトル修正の 400 */
  editTitle?: FormState;
  /** 削除できない理由（409） */
  deleteError?: { title: string; body: string };
  /** 投稿の修正の 400 */
  editPost?: { id: number; state: FormState };
  /** 返信の 400 */
  newReply?: FormState;
};

export function ThreadPage({ user, thread: t, posts, editTitle, deleteError, editPost, newReply }: Props) {
  const hue = communityHue(t.community_id);
  const isOwner = t.author_email === user;
  return (
    <Layout title={t.title} user={user} current="in-communities" postCommunityId={t.community_id}>
      <PageHeader
        eyebrow={<CommunityChip id={t.community_id} name={t.community_name} />}
        title={
          <>
            {t.title}
            {t.updated_at && (
              <>
                {" "}
                <Edited updatedAt={t.updated_at} />
              </>
            )}
          </>
        }
        hue={hue}
        titleLength={[...t.title].length}
        actions={
          <OwnerActions
            isOwner={isOwner}
            editOpen={editTitle !== undefined}
            editLabel="タイトルを編集"
            edit={
              <Form action={`/t/${t.id}/edit`} submitLabel="保存する" errors={errorList(editTitle)}>
                <Field
                  formId="edit-thread"
                  name="title"
                  label="タイトル"
                  max={RULES.threadTitle.max}
                  required
                  value={editTitle?.values.title ?? t.title}
                  error={editTitle?.errors.title}
                />
              </Form>
            }
            deleteAction={`/t/${t.id}/delete`}
            deleteConfirm="このスレッドを本文ごと削除しますか？この操作は取り消せません。"
          />
        }
      />
      {deleteError && (
        <div class="page-notice">
          <Notice tone="error" title={deleteError.title}>
            {deleteError.body}
          </Notice>
        </div>
      )}
      <div class="page-grid" style={`--community-hue: ${hue}`}>
        <div class="col-margin">
          <MarginNote
            title="このスレッドについて"
            items={[
              { label: "作成者", value: displayName(t.author_email) },
              { label: "投稿", value: <span class="num">{t.post_count}</span> },
              { label: "最終投稿", value: <Timestamp iso={t.last_posted_at} /> },
            ]}
          />
        </div>
        <section class="col-main" aria-labelledby="posts-title">
          <h2 id="posts-title" class="section-title">
            投稿 <span class="num">{posts.length}</span>
          </h2>
          <PostList>
            {posts.map((p, i) => (
              <PostItem
                no={i + 1}
                actions={<PostActions user={user} post={p} edit={editPost?.id === p.id ? editPost.state : undefined} />}
                post={{
                  id: p.id,
                  body: p.body,
                  isOpening: p.is_opening === 1,
                  authorEmail: p.author_email,
                  createdAt: p.created_at,
                  updatedAt: p.updated_at,
                }}
              />
            ))}
          </PostList>
        </section>
        <section class="col-main" id="reply" aria-label="返信する">
          <Form action={`/t/${t.id}/posts`} title="返信する" submitLabel="返信する" panel errors={errorList(newReply)}>
            <Field
              formId="reply"
              name="body"
              label="本文"
              max={RULES.postBody.max}
              required
              multiline
              rows={5}
              value={newReply?.values.body}
              error={newReply?.errors.body}
              autofocus={newReply !== undefined}
            />
          </Form>
        </section>
      </div>
    </Layout>
  );
}

function PostActions({ user, post: p, edit }: { user: string; post: PostRecord; edit?: FormState }) {
  const isOpening = p.is_opening === 1;
  return (
    <OwnerActions
      isOwner={p.author_email === user}
      editOpen={edit !== undefined}
      editLabel={isOpening ? "本文を編集" : "編集"}
      edit={
        <Form action={`/p/${p.id}/edit`} submitLabel="保存する" errors={errorList(edit)}>
          <Field
            formId={`edit-post-${p.id}`}
            name="body"
            label="本文"
            max={RULES.postBody.max}
            required
            multiline
            rows={5}
            value={edit?.values.body ?? p.body}
            error={edit?.errors.body}
          />
        </Form>
      }
      deleteAction={isOpening ? undefined : `/p/${p.id}/delete`}
      deleteConfirm="この返信を削除しますか？この操作は取り消せません。"
    />
  );
}
