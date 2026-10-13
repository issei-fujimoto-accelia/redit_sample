import { RULES, validateField } from "../lib/validation";
import * as repo from "../repositories/posts";
import { forbidden, notFound, type ServiceResult } from "./result";
import { getThread } from "./threads";

export async function createReply(
  db: D1Database,
  user: string,
  now: Date,
  threadId: number,
  form: { body?: unknown },
): Promise<ServiceResult<number>> {
  await getThread(db, threadId);
  const body = validateField(form.body, RULES.postBody);
  if (!body.ok) return { ok: false, status: 400, values: { body: String(form.body ?? "") }, errors: { body: body.error } };
  const id = await repo.insertReply(db, { threadId, body: body.value, authorEmail: user, createdAt: now.toISOString() });
  if (id === null) throw notFound();
  return { ok: true, value: id };
}

export const OPENING_NOT_DELETABLE =
  "本文は単独では削除できません。返信がないときは、スレッドを削除すると本文も削除されます。";

async function getPost(db: D1Database, id: number) {
  const p = await repo.findPost(db, id);
  if (!p) throw notFound();
  return p;
}

/** 修正に成功したらスレッド ID を返す */
export async function updatePost(
  db: D1Database,
  user: string,
  now: Date,
  id: number,
  form: { body?: unknown },
): Promise<ServiceResult<{ threadId: number }> & { threadId: number }> {
  const post = await getPost(db, id);
  if (post.author_email !== user) throw forbidden();
  const body = validateField(form.body, RULES.postBody);
  if (!body.ok) {
    return { ok: false, status: 400, values: { body: String(form.body ?? "") }, errors: { body: body.error }, threadId: post.thread_id };
  }
  const changes = await repo.updatePostBody(db, { id, authorEmail: user, body: body.value, updatedAt: now.toISOString() });
  if (changes === 0) await explainZero(db, id, user);
  return { ok: true, value: { threadId: post.thread_id }, threadId: post.thread_id };
}

/** 返信を削除する。本文は 409 */
export async function deleteReply(
  db: D1Database,
  user: string,
  id: number,
): Promise<ServiceResult<null> & { threadId: number }> {
  const post = await getPost(db, id);
  if (post.author_email !== user) throw forbidden();
  if (post.is_opening === 1) {
    return { ok: false, status: 409, values: {}, errors: { delete: OPENING_NOT_DELETABLE }, threadId: post.thread_id };
  }
  const changes = await repo.deleteReply(db, id, post.thread_id, user);
  if (changes === 0) await explainZero(db, id, user);
  return { ok: true, value: null, threadId: post.thread_id };
}

async function explainZero(db: D1Database, id: number, user: string) {
  const p = await repo.findPost(db, id);
  if (!p) throw notFound();
  if (p.author_email !== user) throw forbidden();
}
