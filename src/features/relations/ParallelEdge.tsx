import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react';

export type ParallelFlowEdge = Edge<{ offset: number }, 'parallel'>;

const SPACING = 40;

/** offset 이 0 이 아니면 두 노드를 잇는 직선의 수직 방향으로 휘어진 곡선으로 그린다 */
export function ParallelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  ...labelProps
}: EdgeProps<ParallelFlowEdge>) {
  const { label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius } = labelProps;
  const labelOptions = { label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius };
  const offset = data?.offset ?? 0;

  if (offset === 0) {
    const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    return <BaseEdge id={id} path={path} labelX={labelX} labelY={labelY} markerEnd={markerEnd} style={style} {...labelOptions} />;
  }

  const length = Math.hypot(targetX - sourceX, targetY - sourceY) || 1;
  const normalX = -(targetY - sourceY) / length;
  const normalY = (targetX - sourceX) / length;
  const shift = offset * SPACING;
  const labelX = (sourceX + targetX) / 2 + normalX * shift;
  const labelY = (sourceY + targetY) / 2 + normalY * shift;
  // 이차 베지어 곡선의 꼭짓점은 제어점까지 거리의 절반이므로 제어점을 2배 거리에 둔다
  const path = `M ${sourceX},${sourceY} Q ${labelX + normalX * shift},${labelY + normalY * shift} ${targetX},${targetY}`;
  return <BaseEdge id={id} path={path} labelX={labelX} labelY={labelY} markerEnd={markerEnd} style={style} {...labelOptions} />;
}
