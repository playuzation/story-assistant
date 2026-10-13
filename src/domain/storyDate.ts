import type { StoryDate } from './types.ts';

export const hasDate = (d: StoryDate): boolean => d.year !== null;

/** 연 → 월 → 일 순으로 비교 (월/일이 없으면 그 해/달의 맨 앞) */
export function compareStoryDate(a: StoryDate, b: StoryDate): number {
  return (a.year ?? 0) - (b.year ?? 0) || (a.month ?? 0) - (b.month ?? 0) || (a.day ?? 0) - (b.day ?? 0);
}

export function formatStoryDate(d: StoryDate): string {
  if (d.year === null) return '';
  return [`${d.year}년`, d.month !== null && `${d.month}월`, d.day !== null && `${d.day}일`].filter(Boolean).join(' ');
}
