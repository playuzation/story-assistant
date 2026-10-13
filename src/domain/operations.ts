import type { Board, Entity, EntityKind, Folder, StoryData } from './types.ts';

export const newId = (): string => crypto.randomUUID();

export function createEntity(kind: EntityKind, folderId: string | null): Entity {
  return {
    id: newId(),
    kind,
    name: '',
    folderId,
    description: '',
    attributes: [],
    characterIds: [],
    placeIds: [],
  };
}

/** folderId 자신과 모든 하위 폴더 id */
export function descendantFolderIds(folders: Folder[], folderId: string): Set<string> {
  const result = new Set([folderId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of folders) {
      if (f.parentId && result.has(f.parentId) && !result.has(f.id)) {
        result.add(f.id);
        added = true;
      }
    }
  }
  return result;
}

/** 'A / B / C' 형태의 폴더 경로 */
export function folderPath(folders: Folder[], folderId: string): string {
  const names: string[] = [];
  const seen = new Set<string>();
  let current = folders.find((f) => f.id === folderId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = folders.find((f) => f.id === current?.parentId);
  }
  return names.join(' / ');
}

/** 요소 삭제 시 관계, 보드 배치, 사건 참조까지 함께 정리 */
export function removeEntity(data: StoryData, entityId: string): StoryData {
  return {
    ...data,
    entities: data.entities
      .filter((e) => e.id !== entityId)
      .map((e) =>
        e.characterIds.includes(entityId) || e.placeIds.includes(entityId)
          ? {
              ...e,
              characterIds: e.characterIds.filter((id) => id !== entityId),
              placeIds: e.placeIds.filter((id) => id !== entityId),
            }
          : e,
      ),
    relations: data.relations.filter((r) => r.sourceId !== entityId && r.targetId !== entityId),
    boards: data.boards.map((b) => ({ ...b, nodes: b.nodes.filter((n) => n.entityId !== entityId) })),
  };
}

/** 폴더 삭제 시 하위 폴더와 내용물은 상위 폴더로 이동 */
export function removeFolder(data: StoryData, folderId: string): StoryData {
  const target = data.folders.find((f) => f.id === folderId);
  if (!target) return data;
  const parentId = target.parentId;
  const move = <T extends { folderId: string | null }>(item: T): T =>
    item.folderId === folderId ? { ...item, folderId: parentId } : item;
  return {
    ...data,
    folders: data.folders
      .filter((f) => f.id !== folderId)
      .map((f) => (f.parentId === folderId ? { ...f, parentId } : f)),
    entities: data.entities.map(move),
    boards: data.boards.map(move),
  };
}

const GRID_COLUMNS = 4;
const GRID_X = 200;
const GRID_Y = 120;

/** 보드에 없는 요소만 격자 형태로 이어서 배치 */
export function addNodesToBoard(board: Board, entityIds: string[]): Board {
  const existing = new Set(board.nodes.map((n) => n.entityId));
  const nodes = [...board.nodes];
  for (const entityId of entityIds) {
    if (existing.has(entityId)) continue;
    const i = nodes.length;
    nodes.push({ entityId, x: (i % GRID_COLUMNS) * GRID_X, y: Math.floor(i / GRID_COLUMNS) * GRID_Y });
    existing.add(entityId);
  }
  return { ...board, nodes };
}

/** 가져오기 파일의 최소 형식 검증 */
export function parseStoryData(raw: unknown): StoryData {
  const data = raw as Partial<StoryData> | null;
  if (
    !data ||
    !Array.isArray(data.entities) ||
    !Array.isArray(data.folders) ||
    !Array.isArray(data.relations) ||
    !Array.isArray(data.boards)
  ) {
    throw new Error('올바른 Story Assistant 데이터 파일이 아닙니다.');
  }
  return { entities: data.entities, folders: data.folders, relations: data.relations, boards: data.boards };
}
