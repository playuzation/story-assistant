import { describe, expect, it } from 'vitest';
import {
  addNodesToBoard,
  createEntity,
  descendantFolderIds,
  folderPath,
  normalizeStoryData,
  removeEntity,
  removeFolder,
} from './operations.ts';
import { EMPTY_STORY, type Folder, type StoryData } from './types.ts';

const folders: Folder[] = [
  { id: 'a', scope: 'settings', name: 'A', parentId: null },
  { id: 'b', scope: 'settings', name: 'B', parentId: 'a' },
  { id: 'c', scope: 'settings', name: 'C', parentId: 'b' },
  { id: 'd', scope: 'settings', name: 'D', parentId: null },
];

describe('folders', () => {
  it('collects a folder and all of its descendants', () => {
    expect(descendantFolderIds(folders, 'a')).toEqual(new Set(['a', 'b', 'c']));
    expect(descendantFolderIds(folders, 'd')).toEqual(new Set(['d']));
  });

  it('builds a folder path', () => {
    expect(folderPath(folders, 'c')).toBe('A / B / C');
  });

  it('moves children and contents to the parent when a folder is removed', () => {
    const entity = { ...createEntity('character', 'b'), id: 'e1' };
    const data: StoryData = {
      story: EMPTY_STORY,
      folders,
      entities: [entity],
      relations: [],
      boards: [{ id: 'g', name: 'G', folderId: 'b', nodes: [] }],
    };
    const next = removeFolder(data, 'b');
    expect(next.folders.map((f) => f.id)).toEqual(['a', 'c', 'd']);
    expect(next.folders.find((f) => f.id === 'c')?.parentId).toBe('a');
    expect(next.entities[0].folderId).toBe('a');
    expect(next.boards[0].folderId).toBe('a');
  });
});

describe('removeEntity', () => {
  it('cleans up relations, board nodes and event references', () => {
    const hero = { ...createEntity('character', null), id: 'hero' };
    const town = { ...createEntity('place', null), id: 'town' };
    const battle = { ...createEntity('event', null), id: 'battle', characterIds: ['hero'], placeIds: ['town', 'town'] };
    const data: StoryData = {
      story: EMPTY_STORY,
      folders: [],
      entities: [hero, town, battle],
      relations: [{ id: 'r', sourceId: 'hero', targetId: 'town', label: '고향', description: '' }],
      boards: [
        {
          id: 'g',
          name: 'G',
          folderId: null,
          nodes: [
            { entityId: 'hero', x: 0, y: 0 },
            { entityId: 'town', x: 0, y: 0 },
          ],
        },
      ],
    };

    const next = removeEntity(data, 'town');
    expect(next.entities.map((e) => e.id)).toEqual(['hero', 'battle']);
    expect(next.entities.find((e) => e.id === 'battle')?.placeIds).toEqual([]);
    expect(next.entities.find((e) => e.id === 'battle')?.characterIds).toEqual(['hero']);
    expect(next.relations).toEqual([]);
    expect(next.boards[0].nodes.map((n) => n.entityId)).toEqual(['hero']);
  });
});

describe('addNodesToBoard', () => {
  it('adds only missing entities on a grid', () => {
    const board = { id: 'g', name: 'G', folderId: null, nodes: [{ entityId: 'x', x: 10, y: 10 }] };
    const next = addNodesToBoard(board, ['x', 'y', 'y', 'z']);
    expect(next.nodes.map((n) => n.entityId)).toEqual(['x', 'y', 'z']);
    expect(next.nodes[1]).toEqual({ entityId: 'y', x: 200, y: 0 });
  });
});

describe('normalizeStoryData', () => {
  it('fills fields added in later versions without touching existing values', () => {
    const legacy = { id: 'old', kind: 'event', name: '옛 사건', folderId: null, description: '', attributes: [], characterIds: ['x'], placeIds: [] };
    const normalized = normalizeStoryData({ entities: [legacy], folders: [], relations: [], boards: [] } as unknown as StoryData);
    const [entity] = normalized.entities;
    expect(normalized.story).toEqual(EMPTY_STORY);
    expect(entity.id).toBe('old');
    expect(entity.characterIds).toEqual(['x']);
    expect(entity.dates).toEqual([]);
    expect(entity.startDate).toEqual({ year: null, month: null, day: null });
  });
});
