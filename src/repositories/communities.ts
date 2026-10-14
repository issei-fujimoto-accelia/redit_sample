export type CommunityRecord = {
  id: number;
  name: string;
  description: string;
  author_email: string;
  created_at: string;
  updated_at: string | null;
};

const COLUMNS = "id, name, description, author_email, created_at, updated_at";

export function listCommunities(db: D1Database) {
  return db
    .prepare(`SELECT ${COLUMNS} FROM communities ORDER BY name COLLATE NOCASE, id`)
    .all<CommunityRecord>()
    .then((r) => r.results);
}

export function findCommunity(db: D1Database, id: number) {
  return db.prepare(`SELECT ${COLUMNS} FROM communities WHERE id = ?`).bind(id).first<CommunityRecord>();
}

export async function insertCommunity(
  db: D1Database,
  row: { name: string; description: string; authorEmail: string; createdAt: string },
): Promise<number> {
  const r = await db
    .prepare("INSERT INTO communities (name, description, author_email, created_at) VALUES (?, ?, ?, ?) RETURNING id")
    .bind(row.name, row.description, row.authorEmail, row.createdAt)
    .first<{ id: number }>();
  return r!.id;
}

/** D1 の UNIQUE 制約違反か */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

/** 本人のときだけ更新する。更新した行数を返す */
export async function updateCommunity(
  db: D1Database,
  row: { id: number; authorEmail: string; name: string; description: string; updatedAt: string },
): Promise<number> {
  const r = await db
    .prepare("UPDATE communities SET name = ?, description = ?, updated_at = ? WHERE id = ? AND author_email = ?")
    .bind(row.name, row.description, row.updatedAt, row.id, row.authorEmail)
    .run();
  return r.meta.changes;
}

/** 本人で、かつスレッドがないときだけ削除する。削除した行数を返す */
export async function deleteCommunity(db: D1Database, id: number, authorEmail: string): Promise<number> {
  const r = await db
    .prepare(
      "DELETE FROM communities WHERE id = ? AND author_email = ? AND NOT EXISTS (SELECT 1 FROM threads WHERE community_id = communities.id)",
    )
    .bind(id, authorEmail)
    .run();
  return r.meta.changes;
}
