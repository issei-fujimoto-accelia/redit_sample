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

export function findPost(db: D1Database, id: number) {
  return db.prepare(`SELECT ${COLUMNS} FROM posts WHERE id = ?`).bind(id).first<PostRecord>();
}

/** 本人のときだけ本文を更新する。スレッドの `last_posted_at` は変えない */
export async function updatePostBody(
  db: D1Database,
  row: { id: number; authorEmail: string; body: string; updatedAt: string },
): Promise<number> {
  const r = await db
    .prepare("UPDATE posts SET body = ?, updated_at = ? WHERE id = ? AND author_email = ?")
    .bind(row.body, row.updatedAt, row.id, row.authorEmail)
    .run();
  return r.meta.changes;
}

/**
 * 本人の返信を削除し、スレッドの投稿数と最終投稿日時を残りの投稿から再計算する（減算はしない）。
 * 削除した行数を返す。
 */
export async function deleteReply(db: D1Database, id: number, threadId: number, authorEmail: string): Promise<number> {
  const [deleted] = await db.batch([
    db.prepare("DELETE FROM posts WHERE id = ? AND is_opening = 0 AND author_email = ?").bind(id, authorEmail),
    db
      .prepare(
        `UPDATE threads SET
           post_count = (SELECT COUNT(*) FROM posts WHERE thread_id = ?1),
           last_posted_at = COALESCE((SELECT MAX(created_at) FROM posts WHERE thread_id = ?1), last_posted_at)
         WHERE id = ?1`,
      )
      .bind(threadId),
  ]);
  return deleted!.meta.changes;
}
