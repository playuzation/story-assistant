import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EMPTY_DATA,
  addNodesToBoard,
  createEntity,
  newId,
  normalizeStoryData,
  removeEntity,
  removeFolder,
  type Board,
  type Entity,
  type EntityKind,
  type FolderScope,
  type Relation,
  type StoryData,
} from '../domain/index.ts';

interface StoryActions {
  addEntity: (kind: EntityKind, folderId: string | null) => string;
  updateEntity: (id: string, patch: Partial<Omit<Entity, 'id' | 'kind'>>) => void;
  deleteEntity: (id: string) => void;

  addFolder: (scope: FolderScope, parentId: string | null, name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  addRelation: (sourceId: string, targetId: string) => string;
  updateRelation: (id: string, patch: Partial<Pick<Relation, 'label' | 'description'>>) => void;
  deleteRelation: (id: string) => void;

  addBoard: (folderId: string | null, name: string) => string;
  updateBoard: (id: string, patch: Partial<Pick<Board, 'name' | 'folderId'>>) => void;
  deleteBoard: (id: string) => void;
  addBoardNodes: (boardId: string, entityIds: string[]) => void;
  moveBoardNode: (boardId: string, entityId: string, x: number, y: number) => void;
  removeBoardNode: (boardId: string, entityId: string) => void;

  replaceData: (data: StoryData) => void;
}

export type StoryState = StoryData & StoryActions;

const mapBoard = (boards: Board[], id: string, fn: (b: Board) => Board) =>
  boards.map((b) => (b.id === id ? fn(b) : b));

const pickData = (s: StoryData): StoryData => ({
  entities: s.entities,
  folders: s.folders,
  relations: s.relations,
  boards: s.boards,
});

export const useStoryStore = create<StoryState>()(
  persist(
    (set) => ({
      ...EMPTY_DATA,

      addEntity: (kind, folderId) => {
        const entity = createEntity(kind, folderId);
        set((s) => ({ entities: [...s.entities, entity] }));
        return entity.id;
      },
      updateEntity: (id, patch) =>
        set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEntity: (id) => set((s) => removeEntity(pickData(s), id)),

      addFolder: (scope, parentId, name) => {
        const id = newId();
        set((s) => ({ folders: [...s.folders, { id, scope, parentId, name }] }));
        return id;
      },
      renameFolder: (id, name) =>
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),
      deleteFolder: (id) => set((s) => removeFolder(pickData(s), id)),

      addRelation: (sourceId, targetId) => {
        const id = newId();
        set((s) => ({ relations: [...s.relations, { id, sourceId, targetId, label: '', description: '' }] }));
        return id;
      },
      updateRelation: (id, patch) =>
        set((s) => ({ relations: s.relations.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRelation: (id) => set((s) => ({ relations: s.relations.filter((r) => r.id !== id) })),

      addBoard: (folderId, name) => {
        const id = newId();
        set((s) => ({ boards: [...s.boards, { id, name, folderId, nodes: [] }] }));
        return id;
      },
      updateBoard: (id, patch) => set((s) => ({ boards: mapBoard(s.boards, id, (b) => ({ ...b, ...patch })) })),
      deleteBoard: (id) => set((s) => ({ boards: s.boards.filter((b) => b.id !== id) })),
      addBoardNodes: (boardId, entityIds) =>
        set((s) => ({ boards: mapBoard(s.boards, boardId, (b) => addNodesToBoard(b, entityIds)) })),
      moveBoardNode: (boardId, entityId, x, y) =>
        set((s) => ({
          boards: mapBoard(s.boards, boardId, (b) => ({
            ...b,
            nodes: b.nodes.map((n) => (n.entityId === entityId ? { ...n, x, y } : n)),
          })),
        })),
      removeBoardNode: (boardId, entityId) =>
        set((s) => ({
          boards: mapBoard(s.boards, boardId, (b) => ({
            ...b,
            nodes: b.nodes.filter((n) => n.entityId !== entityId),
          })),
        })),

      replaceData: (data) => set(pickData(data)),
    }),
    {
      name: 'story-assistant:data',
      // v2: 날짜(기념일, 사건 발생일/종료일) 필드 추가
      version: 2,
      partialize: (s: StoryState) => pickData(s),
      migrate: (persisted) => normalizeStoryData(persisted as StoryData),
    },
  ),
);

/** 현재 데이터 스냅샷 (내보내기용) */
export const getStoryData = (): StoryData => pickData(useStoryStore.getState());
