export type ThreadRecord = {
  id: number;
  community_id: number;
  community_name: string;
  title: string;
  author_email: string;
  created_at: string;
  updated_at: string | null;
  last_posted_at: string;
  post_count: number;
};

const COLUMNS = `t.id, t.community_id, c.name AS community_name, t.title, t.author_email, t.created_at, t.updated_at,
  t.last_posted_at, t.post_count`;

export function findThread(db: D1Database, id: number) {
  return db
    .prepare(`SELECT ${COLUMNS} FROM threads t JOIN communities c ON c.id = t.community_id WHERE t.id = ?`)
    .bind(id)
    .first<ThreadRecord>();
}

/** スレッドと本文を1つの batch（トランザクション）で作成する（ARCHITECTURE §4.4） */
export async function insertThreadWithOpening(
  db: D1Database,
  row: { communityId: number; title: string; body: string; authorEmail: string; createdAt: string },
): Promise<number> {
  const [thread] = await db.batch<{ id: number }>([
    db
      .prepare(
        `INSERT INTO threads (community_id, title, author_email, created_at, last_posted_at, post_count)
         VALUES (?, ?, ?, ?, ?, 1) RETURNING id`,
      )
      .bind(row.communityId, row.title, row.authorEmail, row.createdAt, row.createdAt),
    db
      .prepare(
        `INSERT INTO posts (thread_id, is_opening, body, author_email, created_at)
         VALUES (last_insert_rowid(), 1, ?, ?, ?)`,
      )
      .bind(row.body, row.authorEmail, row.createdAt),
  ]);
  return thread!.results[0]!.id;
}

/**
 * スレッド一覧（最終投稿日時の新しい順、同時刻は id の大きい順）。
 * 次のページの有無を判定するため、limit + 1 件まで読む。
 */
export function listThreads(db: D1Database, opts: { communityId?: number; limit: number; offset: number }) {
  const where = opts.communityId === undefined ? "" : "WHERE t.community_id = ?";
  const binds = opts.communityId === undefined ? [] : [opts.communityId];
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM threads t JOIN communities c ON c.id = t.community_id ${where}
       ORDER BY t.last_posted_at DESC, t.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...binds, opts.limit + 1, opts.offset)
    .all<ThreadRecord>()
    .then((r) => r.results);
}
