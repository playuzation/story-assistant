import { useMemo } from 'react';
import { EMPTY_DATE, folderPath, newId, type Attribute, type DateEntry, type Entity } from '../../domain/index.ts';
import { useStoryStore } from '../../store/index.ts';
import { DateInput } from './DateInput.tsx';
import { EventFields } from './EventFields.tsx';

interface EntityEditorProps {
  entity: Entity;
  onDeleted: () => void;
}

export function EntityEditor({ entity, onDeleted }: EntityEditorProps) {
  const allFolders = useStoryStore((s) => s.folders);
  const { updateEntity, deleteEntity } = useStoryStore.getState();
  const folders = useMemo(() => allFolders.filter((f) => f.scope === 'settings'), [allFolders]);
  const update = (patch: Partial<Entity>) => updateEntity(entity.id, patch);

  const setAttribute = (id: string, patch: Partial<Attribute>) =>
    update({ attributes: entity.attributes.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  const setDate = (id: string, patch: Partial<DateEntry>) =>
    update({ dates: entity.dates.map((d) => (d.id === id ? { ...d, ...patch } : d)) });

  const onDelete = () => {
    if (!window.confirm(`'${entity.name || '(이름 없음)'}'을(를) 삭제할까요? 연결된 관계도 함께 삭제됩니다.`)) return;
    deleteEntity(entity.id);
    onDeleted();
  };

  return (
    <div>
      <label className="field">
        이름
        <input value={entity.name} autoFocus={!entity.name} onChange={(e) => update({ name: e.target.value })} />
      </label>
      <label className="field">
        폴더
        <select value={entity.folderId ?? ''} onChange={(e) => update({ folderId: e.target.value || null })}>
          <option value="">(최상위)</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {folderPath(folders, f.id)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        설명
        <textarea value={entity.description} onChange={(e) => update({ description: e.target.value })} />
      </label>

      <fieldset className="field-group">
        <legend>설정 항목</legend>
        {entity.attributes.map((a) => (
          <div key={a.id} className="attribute-row">
            <input placeholder="항목 (예: 나이, 성격)" value={a.key} onChange={(e) => setAttribute(a.id, { key: e.target.value })} />
            <button
              type="button"
              className="icon-button"
              aria-label="항목 삭제"
              onClick={() => update({ attributes: entity.attributes.filter((x) => x.id !== a.id) })}
            >
              ✕
            </button>
            <textarea placeholder="내용" value={a.value} onChange={(e) => setAttribute(a.id, { value: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => update({ attributes: [...entity.attributes, { id: newId(), key: '', value: '' }] })}>
          + 설정 항목
        </button>
      </fieldset>

      <fieldset className="field-group">
        <legend>날짜 (기념일 등)</legend>
        {entity.dates.map((d) => (
          <div key={d.id} className="attribute-row">
            <input placeholder="이름 (예: 생일, 건국일)" value={d.label} onChange={(e) => setDate(d.id, { label: e.target.value })} />
            <button
              type="button"
              className="icon-button"
              aria-label="날짜 삭제"
              onClick={() => update({ dates: entity.dates.filter((x) => x.id !== d.id) })}
            >
              ✕
            </button>
            <DateInput value={d.date} onChange={(date) => setDate(d.id, { date })} />
          </div>
        ))}
        <button type="button" onClick={() => update({ dates: [...entity.dates, { id: newId(), label: '', date: EMPTY_DATE }] })}>
          + 날짜
        </button>
      </fieldset>

      {entity.kind === 'event' && <EventFields event={entity} onChange={update} />}

      <button type="button" className="danger" onClick={onDelete}>
        삭제
      </button>
    </div>
  );
}
