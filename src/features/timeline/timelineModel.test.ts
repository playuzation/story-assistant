import { describe, expect, it } from 'vitest';
import { createEntity, type Entity, type StoryDate } from '../../domain/index.ts';
import { buildTimeline } from './timelineModel.ts';

const date = (year: number, month: number | null = null): StoryDate => ({ year, month, day: null });
const event = (name: string, start: StoryDate | null, end: StoryDate | null = null): Entity => ({
  ...createEntity('event', null),
  name,
  ...(start && { startDate: start }),
  ...(end && { endDate: end }),
});

describe('buildTimeline', () => {
  it('groups dated items into ordered rows and assigns non-overlapping lanes', () => {
    const hero: Entity = {
      ...createEntity('character', null),
      name: '아린',
      dates: [
        { id: 'd1', label: '생일', date: date(300, 5) },
        { id: 'd2', label: '', date: { year: null, month: 1, day: 1 } },
      ],
    };
    const war = event('전쟁', date(310), date(315));
    const duel = event('결투', date(312));
    const peace = event('평화 협정', date(316));
    const draft = event('미정 사건', null);

    const { rows, bars, laneCount, undatedEvents } = buildTimeline([hero, war, duel, peace, draft]);

    expect(rows.map((r) => [r.date.year, r.items.map((i) => `${i.entity.name}:${i.text}`)])).toEqual([
      [300, ['아린:생일']],
      [310, ['전쟁:시작']],
      [312, ['결투:']],
      [315, ['전쟁:종료']],
      [316, ['평화 협정:']],
    ]);
    // 결투는 전쟁 기간과 겹치므로 다른 열, 평화 협정은 전쟁이 끝난 뒤라 첫 열을 재사용
    expect(bars.map((b) => [b.entity.name, b.startRow, b.endRow, b.lane])).toEqual([
      ['전쟁', 1, 3, 0],
      ['결투', 2, 2, 1],
      ['평화 협정', 4, 4, 0],
    ]);
    expect(laneCount).toBe(2);
    expect(undatedEvents).toBe(1);
  });

  it('uses the end date alone and swaps reversed ranges', () => {
    const { rows, bars } = buildTimeline([event('A', null, date(5)), event('B', date(9), date(7))]);
    expect(rows.map((r) => r.date.year)).toEqual([5, 7, 9]);
    expect(bars.map((b) => [b.entity.name, b.startRow, b.endRow])).toEqual([
      ['A', 0, 0],
      ['B', 1, 2],
    ]);
  });
});
