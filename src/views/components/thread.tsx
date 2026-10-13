import { communityHue } from "../../lib/community-hue";
import { displayName } from "../../lib/display-name";
import { CommunityChip } from "./community";
import { Edited, EmptyState, Timestamp } from "./common";

export type ThreadRow = {
  id: number;
  title: string;
  communityId: number;
  communityName: string;
  authorEmail: string;
  postCount: number;
  lastPostedAt: string;
  updatedAt: string | null;
};

/** リポジトリの行を一覧の表示用に変換する */
export function toThreadRow(t: {
  id: number;
  title: string;
  community_id: number;
  community_name: string;
  author_email: string;
  post_count: number;
  last_posted_at: string;
  updated_at: string | null;
}): ThreadRow {
  return {
    id: t.id,
    title: t.title,
    communityId: t.community_id,
    communityName: t.community_name,
    authorEmail: t.author_email,
    postCount: t.post_count,
    lastPostedAt: t.last_posted_at,
    updatedAt: t.updated_at,
  };
}

type ThreadListItemProps = {
  thread: ThreadRow;
  /** ホームの横断一覧ではコミュニティ名を出す */
  showCommunity: boolean;
};

export function ThreadListItem({ thread: t, showCommunity }: ThreadListItemProps) {
  return (
    <li class="thread-item" style={`--community-hue: ${communityHue(t.communityId)}`}>
      <p class="thread-item__meta">
        <span class="thread-item__no" aria-hidden="true"></span>
        {showCommunity && <CommunityChip id={t.communityId} name={t.communityName} />}
      </p>
      <h3 class="thread-item__title">
        <a class="thread-item__link" href={`/t/${t.id}`}>
          {t.title}
        </a>
        {t.updatedAt && (
          <>
            {" "}
            <Edited updatedAt={t.updatedAt} />
          </>
        )}
      </h3>
      <p class="thread-item__byline">
        <span>
          <span class="visually-hidden">作成者：</span>
          {displayName(t.authorEmail)}
        </span>
        <span class="thread-item__last-inline">
          <Timestamp iso={t.lastPostedAt} />
        </span>
      </p>
      <p class="thread-item__figures">
        <span class="thread-item__count">{t.postCount}</span>
        <span class="thread-item__count-label">件の投稿</span>
        <span class="thread-item__last">
          <span class="visually-hidden">最終投稿：</span>
          <Timestamp iso={t.lastPostedAt} />
        </span>
      </p>
    </li>
  );
}

type PaginationProps = {
  page: number;
  hasNext: boolean;
  /** `?page=` を付ける前の URL（例：`/`、`/c/1`） */
  baseUrl: string;
};

const pageUrl = (base: string, page: number) => (page <= 1 ? base : `${base}?page=${page}`);

export function Pagination({ page, hasNext, baseUrl }: PaginationProps) {
  const hasPrev = page > 1;
  if (!hasPrev && !hasNext) return null;
  return (
    <nav class="pagination" aria-label="ページ送り">
      {hasPrev ? (
        <a class="pagination__link" href={pageUrl(baseUrl, page - 1)} rel="prev">
          ← 新しいスレッド
        </a>
      ) : (
        <span class="pagination__placeholder" aria-hidden="true"></span>
      )}
      <span class="pagination__current" aria-current="page">
        {page}
        <small>ページ</small>
      </span>
      {hasNext ? (
        <a class="pagination__link pagination__link--next" href={pageUrl(baseUrl, page + 1)} rel="next">
          古いスレッド →
        </a>
      ) : (
        <span class="pagination__placeholder" aria-hidden="true"></span>
      )}
    </nav>
  );
}

type ThreadListProps = {
  threads: ThreadRow[];
  showCommunity: boolean;
  page: number;
  hasNext: boolean;
  baseUrl: string;
  /** 1ページあたりの件数（通し番号の起点に使う） */
  perPage?: number;
  emptyTitle?: string;
  emptyBody?: string;
};

export function ThreadList(p: ThreadListProps) {
  const perPage = p.perPage ?? 20;
  if (p.threads.length === 0) {
    if (p.page > 1) {
      return (
        <EmptyState
          title="このページにスレッドはありません"
          body="ページの範囲を超えています。"
          action={<a href={p.baseUrl}>最初のページへ</a>}
        />
      );
    }
    return <EmptyState title={p.emptyTitle ?? "スレッドはまだありません"} body={p.emptyBody} />;
  }
  return (
    <>
      <ol class={p.page === 1 ? "thread-list thread-list--first" : "thread-list"} role="list" style={`--start: ${(p.page - 1) * perPage}`}>
        {p.threads.map((t) => (
          <ThreadListItem thread={t} showCommunity={p.showCommunity} />
        ))}
      </ol>
      <Pagination page={p.page} hasNext={p.hasNext} baseUrl={p.baseUrl} />
    </>
  );
}
