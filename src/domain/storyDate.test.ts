import { describe, expect, it } from 'vitest';
import { compareStoryDate, formatStoryDate, hasDate } from './storyDate.ts';
import { EMPTY_DATE } from './types.ts';

const d = (year: number | null, month: number | null = null, day: number | null = null) => ({ year, month, day });

describe('storyDate', () => {
  it('orders by year, month, then day (missing parts first)', () => {
    const sorted = [d(312, 3, 5), d(-50), d(312), d(312, 3), d(311, 12, 31)].sort(compareStoryDate);
    expect(sorted.map(formatStoryDate)).toEqual(['-50년', '311년 12월 31일', '312년', '312년 3월', '312년 3월 5일']);
  });

  it('treats a date without a year as unset', () => {
    expect(hasDate(EMPTY_DATE)).toBe(false);
    expect(hasDate(d(null, 3, 5))).toBe(false);
    expect(formatStoryDate(d(null, 3))).toBe('');
  });
});
