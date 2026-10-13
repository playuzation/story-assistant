import { describe, expect, it } from 'vitest';
import { createEntity } from './operations.ts';
import { STORY_FILE_VERSION, fromStoryFile, storyFileName, toStoryFile } from './storyFile.ts';
import type { StoryData } from './types.ts';

const hero = { ...createEntity('character', 'f1'), id: 'hero', name: '아린' };
hero.dates = [{ id: 'd1', label: '생일', date: { year: -5, month: 5, day: null } }];
const town = { ...createEntity('place', null), id: 'town', name: '왕궁' };
const chase = {
  ...createEntity('event', 'f2'),
  id: 'chase',
  name: '추격전',
  characterIds: ['hero'],
  placeIds: ['town', 'town'],
  startDate: { year: 312, month: 3, day: 5 },
};

const sample: StoryData = {
  story: { title: '별의 노래', description: '시놉시스' },
  entities: [hero, town, chase],
  folders: [
    { id: 'f1', scope: 'settings', name: '1부', parentId: null },
    { id: 'f2', scope: 'settings', name: '1장', parentId: 'f1' },
    { id: 'g1', scope: 'relations', name: '관계', parentId: null },
  ],
  relations: [
    { id: 'r1', sourceId: 'hero', targetId: 'town', label: '고향', description: '' },
    { id: 'r2', sourceId: 'hero', targetId: 'town', label: '유배지', description: '' },
  ],
  boards: [
    {
      id: 'b1',
      name: '주인공',
      folderId: 'g1',
      nodes: [
        { entityId: 'hero', x: 0, y: 0 },
        { entityId: 'town', x: 200.5, y: -40 },
      ],
    },
  ],
};

describe('toStoryFile', () => {
  it('writes the agreed v1 structure', () => {
    const file = toStoryFile(sample, new Date('2026-10-13T00:00:00Z'));
    expect(file.format).toBe('story-assistant');
    expect(file.schemaVersion).toBe(1);
    expect(file.savedAt).toBe('2026-10-13T00:00:00.000Z');
    expect(file.story).toEqual(sample.story);
    expect(file.graph.edges[0]).toEqual({ id: 'r1', source: 'hero', target: 'town', label: '고향', description: '' });
    expect(file.views.boards[0].layout).toEqual({ hero: { x: 0, y: 0 }, town: { x: 200.5, y: -40 } });
    // 사건 전용 필드는 사건 노드에만 기록
    expect(file.graph.nodes.find((n) => n.id === 'hero')).not.toHaveProperty('characterIds');
    expect(file.graph.nodes.find((n) => n.id === 'chase')).toMatchObject({ characterIds: ['hero'], placeIds: ['town', 'town'] });
  });
});

describe('fromStoryFile', () => {
  it('restores exactly what was saved', () => {
    const raw = JSON.parse(JSON.stringify(toStoryFile(sample)));
    expect(fromStoryFile(raw)).toEqual({ data: sample, warnings: [] });
  });

  it('rejects files that are not story files or are from a newer version', () => {
    expect(() => fromStoryFile(null)).toThrow('이야기 파일이 아닙니다');
    expect(() => fromStoryFile({ entities: [] })).toThrow('이야기 파일이 아닙니다');
    expect(() => fromStoryFile({ format: 'story-assistant' })).toThrow('버전을 알 수 없습니다');
    expect(() => fromStoryFile({ format: 'story-assistant', schemaVersion: STORY_FILE_VERSION + 1 })).toThrow('더 새로운 버전');
  });

  it('fills missing values and removes broken references with warnings', () => {
    const { data, warnings } = fromStoryFile({
      format: 'story-assistant',
      schemaVersion: 1,
      graph: {
        nodes: [
          { id: 'a', kind: 'character', name: '아린', folderId: 'g1' },
          { id: 'a', kind: 'character', name: '중복' },
          { id: 'p', kind: 'place', name: 42 },
          { id: 'x', kind: 'monster' },
          { id: 'e', kind: 'event', characterIds: ['a', 'p', 'ghost'], placeIds: ['p', 'a'], startDate: { year: '312' } },
        ],
        edges: [
          { id: 'r1', source: 'a', target: 'p', label: '고향' },
          { id: 'r2', source: 'a', target: 'ghost' },
        ],
      },
      folders: [
        { id: 'c1', scope: 'settings', name: '순환1', parentId: 'c2' },
        { id: 'c2', scope: 'settings', name: '순환2', parentId: 'c1' },
        { id: 'g1', scope: 'relations', name: '관계', parentId: 'missing' },
      ],
      views: { boards: [{ id: 'b', name: '보드', folderId: 'c1', layout: { a: { x: 1, y: 2 }, ghost: { x: 0, y: 0 } } }] },
    });

    expect(data.story).toEqual({ title: '', description: '' });
    expect(data.entities.map((e) => [e.id, e.name])).toEqual([
      ['a', '아린'],
      ['p', ''],
      ['e', ''],
    ]);
    expect(data.entities[0].folderId).toBeNull();
    const event = data.entities[2];
    expect([event.characterIds, event.placeIds, event.startDate.year]).toEqual([['a'], ['p'], null]);
    expect(data.relations.map((r) => r.id)).toEqual(['r1']);
    expect(data.folders.map((f) => f.parentId)).toEqual([null, null, null]);
    expect(data.boards[0]).toEqual({ id: 'b', name: '보드', folderId: null, nodes: [{ entityId: 'a', x: 1, y: 2 }] });
    expect(warnings).toEqual([
      '중복된 id 항목 1개를 정리했습니다.',
      '알 수 없는 종류의 요소 1개를 정리했습니다.',
      '없는 요소를 가리키는 관계 1개를 정리했습니다.',
      '사건의 등장 인물·배경 중 없는 요소 참조 3개를 정리했습니다.',
      '관계도에 배치된 없는 요소 1개를 정리했습니다.',
      '잘못된 폴더 연결(최상위로 이동) 5개를 정리했습니다.',
    ]);
  });
});

describe('storyFileName', () => {
  it('builds a safe file name from the title', () => {
    expect(storyFileName('별의 노래: 1/2')).toBe('별의 노래_ 1_2.story.json');
    expect(storyFileName('  ')).toBe('이야기.story.json');
  });
});
