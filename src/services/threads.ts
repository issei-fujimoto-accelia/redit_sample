import { RULES, validateField } from "../lib/validation";
import * as communities from "../repositories/communities";
import * as posts from "../repositories/posts";
import * as repo from "../repositories/threads";
import { forbidden, notFound, type ServiceResult } from "./result";

export type ThreadForm = { title?: unknown; body?: unknown };

export async function createThread(
  db: D1Database,
  user: string,
  now: Date,
  communityId: number,
  form: ThreadForm,
): Promise<ServiceResult<number>> {
  if (!(await communities.findCommunity(db, communityId))) throw notFound();
  const title = validateField(form.title, RULES.threadTitle);
  const body = validateField(form.body, RULES.postBody);
  if (!title.ok || !body.ok) {
    const errors: Record<string, string> = {};
    if (!title.ok) errors.title = title.error;
    if (!body.ok) errors.body = body.error;
    return { ok: false, status: 400, values: { title: String(form.title ?? ""), body: String(form.body ?? "") }, errors };
  }
  const id = await repo.insertThreadWithOpening(db, {
    communityId,
    title: title.value,
    body: body.value,
    authorEmail: user,
    createdAt: now.toISOString(),
  });
  return { ok: true, value: id };
}

export async function getThread(db: D1Database, id: number) {
  const t = await repo.findThread(db, id);
  if (!t) throw notFound();
  return t;
}

export async function getThreadWithPosts(db: D1Database, id: number) {
  const thread = await getThread(db, id);
  return { thread, posts: await posts.listPosts(db, id) };
}

export const PER_PAGE = 20;

/** `?page=` を解釈する。数値でない・1未満は1（ARCHITECTURE §5） */
export function parsePage(raw: string | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const n = Number(raw);
  return n >= 1 && Number.isSafeInteger(n) ? n : 1;
}

export type ThreadPage = { threads: repo.ThreadRecord[]; page: number; hasNext: boolean };

export async function listThreads(db: D1Database, page: number, communityId?: number): Promise<ThreadPage> {
  const rows = await repo.listThreads(db, { communityId, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  return { threads: rows.slice(0, PER_PAGE), page, hasNext: rows.length > PER_PAGE };
}

export const HAS_REPLIES = "返信が残っているスレッドは削除できません。返信がすべて削除されると、本文ごと削除できます。";

export async function updateThreadTitle(
  db: D1Database,
  user: string,
  now: Date,
  id: number,
  form: { title?: unknown },
): Promise<ServiceResult<number>> {
  const current = await getThread(db, id);
  if (current.author_email !== user) throw forbidden();
  const title = validateField(form.title, RULES.threadTitle);
  if (!title.ok) return { ok: false, status: 400, values: { title: String(form.title ?? "") }, errors: { title: title.error } };
  const changes = await repo.updateThreadTitle(db, { id, authorEmail: user, title: title.value, updatedAt: now.toISOString() });
  if (changes === 0) await explainZero(db, id, user);
  return { ok: true, value: id };
}

/** 削除に成功したら所属コミュニティの ID を返す */
export async function deleteThread(db: D1Database, user: string, id: number): Promise<ServiceResult<number>> {
  const current = await getThread(db, id);
  if (current.author_email !== user) throw forbidden();
  const changes = await repo.deleteThreadWithOpening(db, id, user);
  if (changes === 1) return { ok: true, value: current.community_id };
  await explainZero(db, id, user);
  return { ok: false, status: 409, values: {}, errors: { delete: HAS_REPLIES } };
}

/** 条件付きの UPDATE / DELETE が0行だった原因を判別する。子要素ありの場合は戻る */
async function explainZero(db: D1Database, id: number, user: string) {
  const t = await repo.findThread(db, id);
  if (!t) throw notFound();
  if (t.author_email !== user) throw forbidden();
}
