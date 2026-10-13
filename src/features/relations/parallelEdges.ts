import type { Edge } from '@xyflow/react';

/**
 * 같은 두 노드를 잇는 간선들(방향 무관)에 서로 다른 offset 을 부여한다.
 * 예) 3개면 -1, 0, 1 → 가운데는 기본 곡선, 나머지는 양쪽으로 휘어 그린다.
 * 역방향 간선은 수직 방향이 반대이므로 부호를 뒤집어 같은 기준으로 펼친다.
 */
export function withParallelOffsets(edges: Edge[]): Edge[] {
  const groups = new Map<string, Edge[]>();
  const keyOf = (e: Edge) => [e.source, e.target].sort().join('|');
  for (const e of edges) groups.set(keyOf(e), [...(groups.get(keyOf(e)) ?? []), e]);
  return edges.map((e) => {
    const group = groups.get(keyOf(e)) ?? [e];
    const offset = group.indexOf(e) - (group.length - 1) / 2;
    const reversed = e.source > e.target;
    return { ...e, type: 'parallel', data: { offset: reversed && offset !== 0 ? -offset : offset } };
  });
}
