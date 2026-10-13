import { Fragment, useMemo, useState } from 'react';
import { descendantFolderIds, folderPath, formatStoryDate } from '../../domain/index.ts';
import { useStoryStore } from '../../store/index.ts';
import { KindBadge } from '../../shared/ui/index.ts';
import { buildTimeline } from './timelineModel.ts';
import './timeline.css';

/** 타임라인 페이지: 사건 기간과 기념일 등을 시간순으로 표시 */
export function TimelinePage() {
  const entities = useStoryStore((s) => s.entities);
  const allFolders = useStoryStore((s) => s.folders);
  const folders = useMemo(() => allFolders.filter((f) => f.scope === 'settings'), [allFolders]);
  const [folderId, setFolderId] = useState<string | null>(null);

  const { rows, bars, laneCount, undatedEvents } = useMemo(() => {
    const scope = folderId ? descendantFolderIds(folders, folderId) : null;
    return buildTimeline(scope ? entities.filter((e) => e.folderId !== null && scope.has(e.folderId)) : entities);
  }, [entities, folders, folderId]);

  return (
    <div className="page">
      <main className="page-main timeline-main">
        <label className="field timeline-filter">
          폴더
          <select value={folderId ?? ''} onChange={(e) => setFolderId(e.target.value || null)}>
            <option value="">전체</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {folderPath(folders, f.id)}
              </option>
            ))}
          </select>
        </label>

        {rows.length === 0 ? (
          <p className="muted">
            표시할 날짜가 없습니다. 설정 페이지에서 사건의 발생일·종료일이나 요소의 날짜(기념일 등)를 입력하세요.
          </p>
        ) : (
          <div className="timeline" style={{ gridTemplateColumns: `auto ${'14px '.repeat(laneCount)}1fr` }}>
            {rows.map((row, i) => (
              <Fragment key={i}>
                <div className="timeline-date" style={{ gridRow: i + 1, gridColumn: 1 }}>
                  {formatStoryDate(row.date)}
                </div>
                <ul className="timeline-items" style={{ gridRow: i + 1, gridColumn: laneCount + 2 }}>
                  {row.items.map((item, j) => (
                    <li key={j} className="row">
                      <KindBadge kind={item.entity.kind} />
                      <strong>{item.entity.name || '(이름 없음)'}</strong>
                      {item.text && <span className="muted">{item.text}</span>}
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
            {bars.map((bar) => (
              <div
                key={bar.entity.id}
                className="timeline-bar"
                title={bar.entity.name}
                style={{ gridRow: `${bar.startRow + 1} / ${bar.endRow + 2}`, gridColumn: bar.lane + 2 }}
              />
            ))}
          </div>
        )}

        {undatedEvents > 0 && <p className="muted">발생일이 없는 사건 {undatedEvents}개는 표시되지 않았습니다.</p>}
      </main>
    </div>
  );
}
