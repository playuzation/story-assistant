import { createEntity, newId } from './operations.ts';
import {
  ENTITY_KINDS,
  type Board,
  type Entity,
  type EntityKind,
  type Folder,
  type Relation,
  type StoryData,
  type StoryDate,
  type StoryMeta,
} from './types.ts';

export const STORY_FILE_FORMAT = 'story-assistant';
export const STORY_FILE_VERSION = 1;
export const STORY_FILE_EXTENSION = '.story.json';

type EventFields = 'characterIds' | 'placeIds' | 'startDate' | 'endDate';

/** 파일의 노드 = 요소. 사건 전용 필드는 사건일 때만 기록한다. */
export type StoryFileNode = Omit<Entity, EventFields> & Partial<Pick<Entity, EventFields>>;

/** 파일의 간선 = 관계 (같은 두 노드 사이에 여러 개 가능) */
export interface StoryFileEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  description: string;
}

/** 관계도: 노드 id → 좌표 */
export interface StoryFileBoard {
  id: string;
  name: string;
  folderId: string | null;
  layout: Record<string, { x: number; y: number }>;
}

/**
 * 이야기 파일 형식 v1 (이야기 하나 = 파일 하나)
 * - graph: 이야기 모델 (노드, 간선)
 * - folders: 정리 방식
 * - views: 보기 방식 (관계도 배치)
 */
export interface StoryFile {
  format: typeof STORY_FILE_FORMAT;
  schemaVersion: typeof STORY_FILE_VERSION;
  savedAt: string;
  story: StoryMeta;
  graph: { nodes: StoryFileNode[]; edges: StoryFileEdge[] };
  folders: Folder[];
  views: { boards: StoryFileBoard[] };
}

export function toStoryFile(data: StoryData, savedAt = new Date()): StoryFile {
  return {
    format: STORY_FILE_FORMAT,
    schemaVersion: STORY_FILE_VERSION,
    savedAt: savedAt.toISOString(),
    story: data.story,
    graph: {
      nodes: data.entities.map(({ characterIds, placeIds, startDate, endDate, ...node }) =>
        node.kind === 'event' ? { ...node, startDate, endDate, characterIds, placeIds } : node,
      ),
      edges: data.relations.map(({ id, sourceId, targetId, label, description }) => ({
        id,
        source: sourceId,
        target: targetId,
        label,
        description,
      })),
    },
    folders: data.folders,
    views: {
      boards: data.boards.map(({ nodes, ...board }) => ({
        ...board,
        layout: Object.fromEntries(nodes.map((n) => [n.entityId, { x: n.x, y: n.y }])),
      })),
    },
  };
}

/** 파일 이름에 쓸 수 없는 문자를 바꿔 '제목.story.json' 을 만든다 */
export function storyFileName(title: string): string {
  return `${(title.trim() || '이야기').replace(/[\\/:*?"<>|]/g, '_')}${STORY_FILE_EXTENSION}`;
}

// ---- 불러오기: 형식이 어긋난 값은 기본값으로, 끊어진 참조는 제거하고 경고로 알린다 ----

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : {});
const list = (v: unknown): Rec[] => (Array.isArray(v) ? v.map(rec) : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const idOf = (v: unknown): string => (typeof v === 'string' && v ? v : newId());
const refOf = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const int = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : null);
const coord = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const date = (v: unknown): StoryDate => {
  const d = rec(v);
  return { year: int(d.year), month: int(d.month), day: int(d.day) };
};

export interface LoadedStory {
  data: StoryData;
  /** 불러오면서 정리한 내용 (사용자 안내용) */
  warnings: string[];
}

export function fromStoryFile(raw: unknown): LoadedStory {
  const file = rec(raw);
  if (file.format !== STORY_FILE_FORMAT) throw new Error('Story Assistant 이야기 파일이 아닙니다.');
  const version = file.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error('파일 버전을 알 수 없습니다.');
  }
  if (version > STORY_FILE_VERSION) {
    throw new Error('더 새로운 버전의 Story Assistant에서 저장한 파일입니다. 페이지를 새로고침한 뒤 다시 시도하세요.');
  }
  // 이후 버전이 생기면 여기서 이전 버전 파일을 순서대로 변환한다.

  const dropped = { duplicate: 0, kind: 0, edge: 0, eventRef: 0, layout: 0, folder: 0 };
  const unique = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    const result = items.filter((item) => !seen.has(item.id) && seen.add(item.id));
    dropped.duplicate += items.length - result.length;
    return result;
  };

  // 폴더: 부모가 없거나, 다른 범위이거나, 순환하면 최상위로 옮긴다
  const rawFolders = unique(
    list(file.folders).map(
      (f): Folder => ({
        id: idOf(f.id),
        scope: f.scope === 'relations' ? 'relations' : 'settings',
        name: str(f.name),
        parentId: refOf(f.parentId),
      }),
    ),
  );
  const folderById = new Map(rawFolders.map((f) => [f.id, f]));
  const inCycle = (f: Folder) => {
    const seen = new Set<string>();
    for (let p = f.parentId; p && !seen.has(p); p = folderById.get(p)?.parentId ?? null) {
      if (p === f.id) return true;
      seen.add(p);
    }
    return false;
  };
  const folders = rawFolders.map((f) => {
    const parent = f.parentId ? folderById.get(f.parentId) : undefined;
    if (!f.parentId || (parent?.scope === f.scope && !inCycle(f))) return f;
    dropped.folder++;
    return { ...f, parentId: null };
  });
  const folderIn = (scope: Folder['scope'], v: unknown) => {
    const folderId = refOf(v);
    if (folderId === null || folderById.get(folderId)?.scope === scope) return folderId;
    dropped.folder++;
    return null;
  };

  // 노드(요소)
  const graph = rec(file.graph);
  const nodes = list(graph.nodes).filter((n) => {
    const valid = ENTITY_KINDS.includes(n.kind as EntityKind);
    if (!valid) dropped.kind++;
    return valid;
  });
  const entities = unique(
    nodes.map((n): Entity => {
      const kind = n.kind as EntityKind;
      return {
        ...createEntity(kind, folderIn('settings', n.folderId)),
        id: idOf(n.id),
        name: str(n.name),
        description: str(n.description),
        attributes: list(n.attributes).map((a) => ({ id: idOf(a.id), key: str(a.key), value: str(a.value) })),
        dates: list(n.dates).map((d) => ({ id: idOf(d.id), label: str(d.label), date: date(d.date) })),
        ...(kind === 'event' && {
          characterIds: ids(n.characterIds),
          placeIds: ids(n.placeIds),
          startDate: date(n.startDate),
          endDate: date(n.endDate),
        }),
      };
    }),
  );
  const kindById = new Map(entities.map((e) => [e.id, e.kind]));
  const keepRefs = (refs: string[], kind: EntityKind) => {
    const kept = refs.filter((id) => kindById.get(id) === kind);
    dropped.eventRef += refs.length - kept.length;
    return kept;
  };
  for (const e of entities) {
    e.characterIds = keepRefs(e.characterIds, 'character');
    e.placeIds = keepRefs(e.placeIds, 'place');
  }

  // 간선(관계)
  const relations = unique(
    list(graph.edges).map(
      (r): Relation => ({
        id: idOf(r.id),
        sourceId: str(r.source),
        targetId: str(r.target),
        label: str(r.label),
        description: str(r.description),
      }),
    ),
  ).filter((r) => {
    const valid = kindById.has(r.sourceId) && kindById.has(r.targetId);
    if (!valid) dropped.edge++;
    return valid;
  });

  // 관계도 배치
  const boards = unique(
    list(rec(file.views).boards).map((b): Board => {
      const layout = Object.entries(rec(b.layout));
      const placed = layout.filter(([entityId]) => kindById.has(entityId));
      dropped.layout += layout.length - placed.length;
      return {
        id: idOf(b.id),
        name: str(b.name),
        folderId: folderIn('relations', b.folderId),
        nodes: placed.map(([entityId, pos]) => ({ entityId, x: coord(rec(pos).x), y: coord(rec(pos).y) })),
      };
    }),
  );

  const story = rec(file.story);
  const messages: [number, string][] = [
    [dropped.duplicate, '중복된 id 항목'],
    [dropped.kind, '알 수 없는 종류의 요소'],
    [dropped.edge, '없는 요소를 가리키는 관계'],
    [dropped.eventRef, '사건의 등장 인물·배경 중 없는 요소 참조'],
    [dropped.layout, '관계도에 배치된 없는 요소'],
    [dropped.folder, '잘못된 폴더 연결(최상위로 이동)'],
  ];
  return {
    data: {
      story: { title: str(story.title), description: str(story.description) },
      entities,
      folders,
      relations,
      boards,
    },
    warnings: messages.filter(([count]) => count > 0).map(([count, label]) => `${label} ${count}개를 정리했습니다.`),
  };
}
