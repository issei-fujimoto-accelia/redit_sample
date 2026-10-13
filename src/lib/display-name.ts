/** 表示名：メールアドレスの `@` より前（REQUIREMENTS FR-C-2、ADR-4） */
export function displayName(email: string): string {
  const at = email.indexOf("@");
  return at === -1 ? email : email.slice(0, at);
}
