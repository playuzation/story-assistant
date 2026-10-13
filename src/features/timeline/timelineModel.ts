import { compareStoryDate, hasDate, type Entity, type StoryDate } from '../../domain/index.ts';

export interface TimelineItem {
  entity: Entity;
  /** 날짜 이름 또는 '시작'/'종료' (하루짜리 사건은 빈 문자열) */
  text: string;
}

export interface TimelineRow {
  date: StoryDate;
  items: TimelineItem[];
}

/** 사건 기간 막대: rows 인덱스 기준 시작/끝 행과 겹치지 않게 배정된 열(lane) */
export interface TimelineBar {
  entity: Entity;
  startRow: number;
  endRow: number;
  lane: number;
}

export interface Timeline {
  rows: TimelineRow[];
  bars: TimelineBar[];
  laneCount: number;
  /** 발생일·종료일이 모두 없는 사건 수 */
  undatedEvents: number;
}

/**
 * 날짜가 있는 항목을 시간순 행으로 묶는다.
 * 가상 달력도 다룰 수 있도록 실제 시간 간격이 아닌 순서(행)로 배치한다.
 */
export function buildTimeline(entities: Entity[]): Timeline {
  const points: { date: StoryDate; item: TimelineItem }[] = [];
  const ranges: { entity: Entity; start: StoryDate; end: StoryDate }[] = [];
  let undatedEvents = 0;

  for (const entity of entities) {
    for (const d of entity.dates) {
      if (hasDate(d.date)) points.push({ date: d.date, item: { entity, text: d.label || '날짜' } });
    }
    if (entity.kind !== 'event') continue;
    const dated = [entity.startDate, entity.endDate].filter(hasDate).sort(compareStoryDate);
    if (dated.length === 0) {
      undatedEvents++;
      continue;
    }
    const [start, end] = [dated[0], dated[dated.length - 1]];
    const oneDay = compareStoryDate(start, end) === 0;
    ranges.push({ entity, start, end });
    points.push({ date: start, item: { entity, text: oneDay ? '' : '시작' } });
    if (!oneDay) points.push({ date: end, item: { entity, text: '종료' } });
  }

  const rows: TimelineRow[] = [];
  for (const p of points.sort((a, b) => compareStoryDate(a.date, b.date))) {
    const last = rows[rows.length - 1];
    if (last && compareStoryDate(last.date, p.date) === 0) last.items.push(p.item);
    else rows.push({ date: p.date, items: [p.item] });
  }

  const rowOf = (d: StoryDate) => rows.findIndex((r) => compareStoryDate(r.date, d) === 0);
  const laneEnds: number[] = [];
  const bars = ranges
    .map((r) => ({ entity: r.entity, startRow: rowOf(r.start), endRow: rowOf(r.end) }))
    .sort((a, b) => a.startRow - b.startRow || a.endRow - b.endRow)
    .map((bar) => {
      const free = laneEnds.findIndex((end) => end < bar.startRow);
      const lane = free === -1 ? laneEnds.length : free;
      laneEnds[lane] = bar.endRow;
      return { ...bar, lane };
    });

  return { rows, bars, laneCount: laneEnds.length, undatedEvents };
}
