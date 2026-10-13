import { useEffect, useMemo, useState } from 'react';
import {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  useNodesState,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Board, Entity, Relation } from '../../domain/index.ts';
import { useStoryStore } from '../../store/index.ts';
import { DetailPanel } from '../../shared/ui/index.ts';
import { EntityNode, type EntityFlowNode } from './EntityNode.tsx';
import { BoardSettingsPanel, NodePanel, RelationPanel } from './BoardPanels.tsx';
import type { PanelState } from './panelState.ts';

const nodeTypes = { entity: EntityNode };

function buildNodes(board: Board, entities: Entity[], selectedId: string | null): EntityFlowNode[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  return board.nodes.flatMap((n) => {
    const e = byId.get(n.entityId);
    return e
      ? [{ id: e.id, type: 'entity' as const, position: { x: n.x, y: n.y }, data: { name: e.name, kind: e.kind }, selected: e.id === selectedId }]
      : [];
  });
}

function buildEdges(board: Board, entities: Entity[], relations: Relation[], selectedId: string | null): Edge[] {
  const onBoard = new Set(board.nodes.map((n) => n.entityId));
  const edges: Edge[] = relations
    .filter((r) => onBoard.has(r.sourceId) && onBoard.has(r.targetId))
    .map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      label: r.label,
      markerEnd: { type: MarkerType.ArrowClosed },
      selected: r.id === selectedId,
    }));
  // 사건 설정(등장 인물, 배경 전환)은 점선으로 표시하며 설정 페이지에서 편집한다.
  for (const e of entities) {
    if (e.kind !== 'event' || !onBoard.has(e.id)) continue;
    const derived = { source: e.id, className: 'derived-edge', selectable: false };
    e.characterIds
      .filter((id) => onBoard.has(id))
      .forEach((id) => edges.push({ ...derived, id: `event:${e.id}:character:${id}`, target: id, label: '등장' }));
    e.placeIds.forEach((id, i) => {
      if (onBoard.has(id)) edges.push({ ...derived, id: `event:${e.id}:place:${i}`, target: id, label: `배경 ${i + 1}` });
    });
  }
  return edges;
}

interface BoardCanvasProps {
  board: Board;
  onOpenTree: () => void;
}

export function BoardCanvas({ board, onOpenTree }: BoardCanvasProps) {
  const entities = useStoryStore((s) => s.entities);
  const relations = useStoryStore((s) => s.relations);
  const { addRelation, moveBoardNode } = useStoryStore.getState();
  const [panel, setPanel] = useState<PanelState>(null);

  const selectedNodeId = panel?.type === 'node' ? panel.id : null;
  const selectedEdgeId = panel?.type === 'edge' ? panel.id : null;

  // 드래그 중 위치는 로컬 상태로 관리하고, 드래그가 끝나면 저장소에 반영
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(board, entities, selectedNodeId));
  useEffect(() => setNodes(buildNodes(board, entities, selectedNodeId)), [board, entities, selectedNodeId, setNodes]);
  const edges = useMemo(
    () => buildEdges(board, entities, relations, selectedEdgeId),
    [board, entities, relations, selectedEdgeId],
  );

  // 삭제된 요소/관계를 가리키는 패널은 닫는다
  const panelTargetExists =
    !panel ||
    panel.type === 'board' ||
    (panel.type === 'node' ? board.nodes.some((n) => n.entityId === panel.id) : relations.some((r) => r.id === panel.id));
  const activePanel = panelTargetExists ? panel : null;

  return (
    <main className="page-main board-main">
      <div className="row board-toolbar">
        <button type="button" className="mobile-only" onClick={onOpenTree}>☰ 폴더</button>
        <strong className="board-title">{board.name}</strong>
        <button type="button" className="primary" onClick={() => setPanel({ type: 'board' })}>
          + 요소 추가 / 보드 설정
        </button>
      </div>
      <div className="board-body">
        <div className="board-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStop={(_, __, dragged) =>
              dragged.forEach((n) => moveBoardNode(board.id, n.id, n.position.x, n.position.y))
            }
            onConnect={(c) => {
              if (c.source && c.target && c.source !== c.target) {
                setPanel({ type: 'edge', id: addRelation(c.source, c.target) });
              }
            }}
            onNodeClick={(_, n) => setPanel({ type: 'node', id: n.id })}
            onEdgeClick={(_, e) => relations.some((r) => r.id === e.id) && setPanel({ type: 'edge', id: e.id })}
            onPaneClick={() => setPanel(null)}
            connectionMode={ConnectionMode.Loose}
            deleteKeyCode={null}
            fitView
            fitViewOptions={{ maxZoom: 1 }}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
          {board.nodes.length === 0 && (
            <p className="board-empty muted">‘요소 추가’로 인물·사건·배경·물건을 올린 뒤, 점(●)을 끌거나 차례로 눌러 관계를 연결하세요.</p>
          )}
        </div>

        {activePanel && (
          <DetailPanel
            variant="sheet"
            title={activePanel.type === 'node' ? '요소' : activePanel.type === 'edge' ? '관계' : '보드 설정'}
            onClose={() => setPanel(null)}
          >
            {activePanel.type === 'node' && <NodePanel board={board} entityId={activePanel.id} onSelect={setPanel} />}
            {activePanel.type === 'edge' && <RelationPanel relationId={activePanel.id} />}
            {activePanel.type === 'board' && <BoardSettingsPanel board={board} />}
          </DetailPanel>
        )}
      </div>
    </main>
  );
}
