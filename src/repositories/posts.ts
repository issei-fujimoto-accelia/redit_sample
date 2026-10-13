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
