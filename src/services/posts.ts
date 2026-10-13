import { RULES, validateField } from "../lib/validation";
import * as repo from "../repositories/posts";
import { notFound, type ServiceResult } from "./result";
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
