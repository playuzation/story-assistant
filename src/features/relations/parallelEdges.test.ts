import { describe, expect, it } from 'vitest';
import { withParallelOffsets } from './parallelEdges.ts';

describe('withParallelOffsets', () => {
  it('spreads edges between the same pair of nodes in either direction', () => {
    const edges = withParallelOffsets([
      { id: 'r1', source: 'a', target: 'b' },
      { id: 'r2', source: 'a', target: 'b' },
      { id: 'r3', source: 'a', target: 'b' },
      { id: 'r4', source: 'b', target: 'a' },
    ]);
    // r4 는 역방향이라 부호가 반대: 화면상으로는 1.5 쪽에 그려진다
    expect(edges.map((e) => e.data?.offset)).toEqual([-1.5, -0.5, 0.5, -1.5]);
    expect(edges.every((e) => e.type === 'parallel')).toBe(true);
  });
});
