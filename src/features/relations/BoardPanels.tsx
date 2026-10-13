import { useMemo, useState } from 'react';
import { ENTITY_KINDS, KIND_LABEL, folderPath, type Board, type EntityKind } from '../../domain/index.ts';
import { useStoryStore } from '../../store/index.ts';
import { KindBadge } from '../../shared/ui/index.ts';
import type { PanelState } from './panelState.ts';

const nameOr = (name: string | undefined) => name || '(이름 없음)';

/** 선택한 요소: 연결된 관계 목록, 관계 추가(모바일 대체 수단), 보드에서 제거 */
export function NodePanel({
  board,
  entityId,
  onSelect,
}: {
  board: Board;
  entityId: string;
  onSelect: (panel: PanelState) => void;
}) {
  const entities = useStoryStore((s) => s.entities);
  const relations = useStoryStore((s) => s.relations);
  const { addRelation, removeBoardNode } = useStoryStore.getState();
  const entity = entities.find((e) => e.id === entityId);
  const nameOf = (id: string) => nameOr(entities.find((e) => e.id === id)?.name);
  const linked = relations.filter((r) => r.sourceId === entityId || r.targetId === entityId);
  const others = board.nodes.filter((n) => n.entityId !== entityId);

  if (!entity) return null;
  return (
    <div>
      <p className="row">
        <KindBadge kind={entity.kind} />
        <strong>{nameOr(entity.name)}</strong>
      </p>
      {entity.description && <p className="muted pre-wrap">{entity.description}</p>}

      <h3 className="panel-subtitle">관계</h3>
      {linked.length === 0 && <p className="muted">연결된 관계가 없습니다.</p>}
      <ul className="link-list">
        {linked.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onSelect({ type: 'edge', id: r.id })}>
              {nameOf(r.sourceId)} → {nameOf(r.targetId)}
              {r.label && <span className="muted"> · {r.label}</span>}
            </button>
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onSelect({ type: 'edge', id: addRelation(entityId, e.target.value) })}
        >
          <option value="">+ 관계 추가 (대상 선택)</option>
          {others.map((n) => (
            <option key={n.entityId} value={n.entityId}>
              {nameOf(n.entityId)}
            </option>
          ))}
        </select>
      )}

      <p>
        <button type="button" className="danger" onClick={() => removeBoardNode(board.id, entityId)}>
          이 관계도에서 빼기
        </button>
      </p>
    </div>
  );
}

/** 선택한 관계: 이름/설명 편집, 삭제 */
export function RelationPanel({ relationId }: { relationId: string }) {
  const entities = useStoryStore((s) => s.entities);
  const relation = useStoryStore((s) => s.relations.find((r) => r.id === relationId));
  const { updateRelation, deleteRelation } = useStoryStore.getState();
  const nameOf = (id: string) => nameOr(entities.find((e) => e.id === id)?.name);

  if (!relation) return null;
  return (
    <div>
      <p>
        <strong>{nameOf(relation.sourceId)}</strong> → <strong>{nameOf(relation.targetId)}</strong>
      </p>
      <label className="field">
        관계 (예: 친구, 소유, 발생 장소)
        <input
          value={relation.label}
          autoFocus={!relation.label}
          onChange={(e) => updateRelation(relation.id, { label: e.target.value })}
        />
      </label>
      <label className="field">
        설명
        <textarea value={relation.description} onChange={(e) => updateRelation(relation.id, { description: e.target.value })} />
      </label>
      <button type="button" className="danger" onClick={() => deleteRelation(relation.id)}>
        관계 삭제
      </button>
    </div>
  );
}

/** 보드 설정: 보드가 속한 폴더, 요소 추가 */
export function BoardSettingsPanel({ board }: { board: Board }) {
  const entities = useStoryStore((s) => s.entities);
  const allFolders = useStoryStore((s) => s.folders);
  const { addBoardNodes, updateBoard } = useStoryStore.getState();
  const [kind, setKind] = useState<EntityKind | 'all'>('all');

  const folders = useMemo(() => allFolders.filter((f) => f.scope === 'relations'), [allFolders]);
  const candidates = useMemo(() => {
    const onBoard = new Set(board.nodes.map((n) => n.entityId));
    return entities.filter((e) => !onBoard.has(e.id) && (kind === 'all' || e.kind === kind));
  }, [entities, board.nodes, kind]);

  return (
    <div>
      <label className="field">
        폴더
        <select value={board.folderId ?? ''} onChange={(e) => updateBoard(board.id, { folderId: e.target.value || null })}>
          <option value="">(최상위)</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {folderPath(folders, f.id)}
            </option>
          ))}
        </select>
      </label>

      <h3 className="panel-subtitle">요소 추가</h3>
      <div className="row">
        <select value={kind} onChange={(e) => setKind(e.target.value as EntityKind | 'all')}>
          <option value="all">전체</option>
          {ENTITY_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={candidates.length === 0}
          onClick={() => addBoardNodes(board.id, candidates.map((e) => e.id))}
        >
          모두 추가
        </button>
      </div>
      {candidates.length === 0 ? (
        <p className="muted">추가할 요소가 없습니다. 설정 페이지에서 요소를 만들 수 있습니다.</p>
      ) : (
        <ul className="link-list">
          {candidates.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => addBoardNodes(board.id, [e.id])}>
                <KindBadge kind={e.kind} /> {nameOr(e.name)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
