import { RULES, validateField } from "../lib/validation";
import * as repo from "../repositories/communities";
import { forbidden, notFound, type ServiceResult } from "./result";

export type CommunityForm = { name?: unknown; description?: unknown };

export const DUPLICATE_NAME = "同じ名前のコミュニティがすでにあります。";

function validate(form: CommunityForm) {
  const name = validateField(form.name, RULES.communityName);
  const description = validateField(form.description, RULES.communityDescription);
  const values = { name: String(form.name ?? ""), description: String(form.description ?? "") };
  const errors: Record<string, string> = {};
  if (!name.ok) errors.name = name.error;
  if (!description.ok) errors.description = description.error;
  return { name, description, values, errors };
}

export async function createCommunity(
  db: D1Database,
  user: string,
  now: Date,
  form: CommunityForm,
): Promise<ServiceResult<number>> {
  const v = validate(form);
  if (!v.name.ok || !v.description.ok) return { ok: false, status: 400, values: v.values, errors: v.errors };
  try {
    const id = await repo.insertCommunity(db, {
      name: v.name.value,
      description: v.description.value,
      authorEmail: user,
      createdAt: now.toISOString(),
    });
    return { ok: true, value: id };
  } catch (e) {
    if (repo.isUniqueViolation(e)) return { ok: false, status: 409, values: v.values, errors: { name: DUPLICATE_NAME } };
    throw e;
  }
}

export const listCommunities = (db: D1Database) => repo.listCommunities(db);

export async function getCommunity(db: D1Database, id: number) {
  const c = await repo.findCommunity(db, id);
  if (!c) throw notFound();
  return c;
}

export const HAS_THREADS = "スレッドが残っているコミュニティは削除できません。スレッドをすべて削除すると、コミュニティを削除できます。";

export async function updateCommunity(
  db: D1Database,
  user: string,
  now: Date,
  id: number,
  form: CommunityForm,
): Promise<ServiceResult<number>> {
  const current = await getCommunity(db, id);
  if (current.author_email !== user) throw forbidden();
  const v = validate(form);
  if (!v.name.ok || !v.description.ok) return { ok: false, status: 400, values: v.values, errors: v.errors };
  try {
    const changes = await repo.updateCommunity(db, {
      id,
      authorEmail: user,
      name: v.name.value,
      description: v.description.value,
      updatedAt: now.toISOString(),
    });
    if (changes === 0) await explainZero(db, id, user);
    return { ok: true, value: id };
  } catch (e) {
    if (repo.isUniqueViolation(e)) return { ok: false, status: 409, values: v.values, errors: { name: DUPLICATE_NAME } };
    throw e;
  }
}

export async function deleteCommunity(db: D1Database, user: string, id: number): Promise<ServiceResult<null>> {
  const current = await getCommunity(db, id);
  if (current.author_email !== user) throw forbidden();
  const changes = await repo.deleteCommunity(db, id, user);
  if (changes === 1) return { ok: true, value: null };
  await explainZero(db, id, user);
  return { ok: false, status: 409, values: {}, errors: { delete: HAS_THREADS } };
}

/** 条件付きの UPDATE / DELETE が0行だった原因を判別する（ARCHITECTURE §4.4）。子要素ありの場合は戻る */
async function explainZero(db: D1Database, id: number, user: string) {
  const c = await repo.findCommunity(db, id);
  if (!c) throw notFound();
  if (c.author_email !== user) throw forbidden();
}
