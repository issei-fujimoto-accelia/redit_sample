import { communityHue } from "../../lib/community-hue";
import { displayName } from "../../lib/display-name";
import type { PostRecord } from "../../repositories/posts";
import type { ThreadRecord } from "../../repositories/threads";
import { CommunityChip } from "../components/community";
import { Edited, MarginNote, Timestamp } from "../components/common";
import { PostItem, PostList } from "../components/post";
import { Layout, PageHeader } from "../components/site";

type Props = {
  user: string;
  thread: ThreadRecord;
  posts: PostRecord[];
};

export function ThreadPage({ user, thread: t, posts }: Props) {
  const hue = communityHue(t.community_id);
  return (
    <Layout title={t.title} user={user}>
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
      />
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
      </div>
    </Layout>
  );
}
