/** 黄金角（度）。連番の ID を色相環上で均等に散らす */
const GOLDEN_ANGLE = 137.508;

/** コミュニティ ID から色相（0〜359 の整数）を決定的に導出する（UI_GUIDELINES §2.2、§3.1） */
export function communityHue(id: number): number {
  return Math.round((id * GOLDEN_ANGLE) % 360) % 360;
}
