import type { CommunityRecord } from "../../repositories/communities";
import type { ThreadPage } from "../../services/threads";
import { CommunityChip } from "../components/community";
import { Layout, PageHeader } from "../components/site";
import { ThreadList, toThreadRow } from "../components/thread";

type Props = { user: string; list: ThreadPage; communities: CommunityRecord[] };

/** ホーム（発見）：全コミュニティ横断のスレッド一覧。欄外にコミュニティの索引を置く */
export function HomePage({ user, list, communities }: Props) {
  return (
    <Layout user={user} current="home">
      <PageHeader
        eyebrow="すべてのコミュニティから、新しく動いた順に"
        title={
          <>
            議論の索引 <span class="latin">Index</span>
          </>
        }
      />
      <div class="page-grid">
        <aside class="col-margin" aria-labelledby="index-title">
          <div class="margin-note margin-note--plain">
            <p class="margin-note__title" id="index-title">
              コミュニティ
            </p>
            {communities.length === 0 ? (
              <p class="muted">
                まだありません。<a href="/c#new-community">最初のコミュニティを作る</a>
              </p>
            ) : (
              <ul class="community-index" role="list">
                {communities.map((c) => (
                  <li>
                    <CommunityChip id={c.id} name={c.name} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <section class="col-main home-threads" aria-labelledby="home-threads-title">
          <h2 id="home-threads-title" class="section-title">
            スレッド
            {list.page > 1 && <span class="num">{list.page} ページ目</span>}
          </h2>
          <ThreadList
            threads={list.threads.map(toThreadRow)}
            showCommunity
            page={list.page}
            hasNext={list.hasNext}
            baseUrl="/"
            emptyTitle="スレッドはまだありません"
            emptyBody="コミュニティを開いて、最初のスレッドを立てましょう。"
          />
        </section>
      </div>
    </Layout>
  );
}
