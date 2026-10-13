import { RULES, validateField } from "../lib/validation";
import * as communities from "../repositories/communities";
import * as posts from "../repositories/posts";
import * as repo from "../repositories/threads";
import { notFound, type ServiceResult } from "./result";

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
