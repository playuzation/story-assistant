import { useMemo } from 'react';
import type { Entity } from '../../domain/index.ts';
import { useStoryStore } from '../../store/index.ts';

interface EventFieldsProps {
  event: Entity;
  onChange: (patch: Partial<Entity>) => void;
}

/** 사건 전용: 등장 인물과 배경 전환 순서 */
export function EventFields({ event, onChange }: EventFieldsProps) {
  const entities = useStoryStore((s) => s.entities);
  const characters = useMemo(() => entities.filter((e) => e.kind === 'character'), [entities]);
  const places = useMemo(() => entities.filter((e) => e.kind === 'place'), [entities]);
  const nameOf = (id: string) => entities.find((e) => e.id === id)?.name || '(이름 없음)';

  const toggleCharacter = (id: string) =>
    onChange({
      characterIds: event.characterIds.includes(id)
        ? event.characterIds.filter((c) => c !== id)
        : [...event.characterIds, id],
    });

  const movePlace = (index: number, delta: number) => {
    const next = [...event.placeIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ placeIds: next });
  };

  return (
    <>
      <fieldset className="field-group">
        <legend>등장 인물</legend>
        {characters.length === 0 ? (
          <p className="muted">먼저 인물을 추가하세요.</p>
        ) : (
          <div className="row">
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip${event.characterIds.includes(c.id) ? ' on' : ''}`}
                aria-pressed={event.characterIds.includes(c.id)}
                onClick={() => toggleCharacter(c.id)}
              >
                {c.name || '(이름 없음)'}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend>배경 전환</legend>
        {event.placeIds.length > 0 && (
          <p className="muted">{event.placeIds.map(nameOf).join(' → ')}</p>
        )}
        <ol className="place-steps">
          {event.placeIds.map((id, i) => (
            <li key={`${id}-${i}`} className="row">
              <span className="place-step-name">{nameOf(id)}</span>
              <button type="button" className="icon-button" aria-label="위로" onClick={() => movePlace(i, -1)}>↑</button>
              <button type="button" className="icon-button" aria-label="아래로" onClick={() => movePlace(i, 1)}>↓</button>
              <button
                type="button"
                className="icon-button"
                aria-label="삭제"
                onClick={() => onChange({ placeIds: event.placeIds.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        {places.length === 0 ? (
          <p className="muted">먼저 배경을 추가하세요.</p>
        ) : (
          <select
            value=""
            onChange={(e) => e.target.value && onChange({ placeIds: [...event.placeIds, e.target.value] })}
          >
            <option value="">+ 배경 추가</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || '(이름 없음)'}
              </option>
            ))}
          </select>
        )}
      </fieldset>
    </>
  );
}
