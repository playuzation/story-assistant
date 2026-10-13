import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { EntityKind } from '../../domain/index.ts';
import { KindBadge } from '../../shared/ui/index.ts';

export type EntityFlowNode = Node<{ name: string; kind: EntityKind }, 'entity'>;

/** 관계도 위의 요소 노드 */
export function EntityNode({ data, selected }: NodeProps<EntityFlowNode>) {
  return (
    <div className={`entity-node kind-${data.kind}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <KindBadge kind={data.kind} />
      <span className="entity-node-name">{data.name || '(이름 없음)'}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
