const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/** UTC の ISO 8601 文字列を JST の `YYYY-MM-DD HH:mm` にする（FR-C-3） */
export function formatJst(iso: string): string {
  const d = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}
