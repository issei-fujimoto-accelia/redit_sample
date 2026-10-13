export type PostRecord = {
  id: number;
  thread_id: number;
  is_opening: number;
  body: string;
  author_email: string;
  created_at: string;
  updated_at: string | null;
};

const COLUMNS = "id, thread_id, is_opening, body, author_email, created_at, updated_at";

/** スレッドの投稿を古い順に返す（本文が先頭） */
export function listPosts(db: D1Database, threadId: number) {
  return db
    .prepare(`SELECT ${COLUMNS} FROM posts WHERE thread_id = ? ORDER BY created_at, id`)
    .bind(threadId)
    .all<PostRecord>()
    .then((r) => r.results);
}

/**
 * 返信を作成し、スレッドの投稿数と最終投稿日時を同じ batch で更新する（ARCHITECTURE §4.4、ADR-3）。
 * スレッドが存在しない場合は null を返す。
 */
export async function insertReply(
  db: D1Database,
  row: { threadId: number; body: string; authorEmail: string; createdAt: string },
): Promise<number | null> {
  const [inserted] = await db.batch<{ id: number }>([
    db
      .prepare(
        `INSERT INTO posts (thread_id, is_opening, body, author_email, created_at)
         SELECT ?1, 0, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM threads WHERE id = ?1) RETURNING id`,
      )
      .bind(row.threadId, row.body, row.authorEmail, row.createdAt),
    db
      .prepare("UPDATE threads SET post_count = post_count + 1, last_posted_at = ?2 WHERE id = ?1")
      .bind(row.threadId, row.createdAt),
  ]);
  return inserted!.results[0]?.id ?? null;
}
