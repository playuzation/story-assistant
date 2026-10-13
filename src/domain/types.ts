// 도메인 최하위 계층: 다른 모듈을 import 하지 않는다.

export type EntityKind = 'character' | 'event' | 'place' | 'item';

export const ENTITY_KINDS: EntityKind[] = ['character', 'event', 'place', 'item'];

export const KIND_LABEL: Record<EntityKind, string> = {
  character: '인물',
  event: '사건',
  place: '배경',
  item: '물건',
};

export interface Attribute {
  id: string;
  key: string;
  value: string;
}

/** 이야기 속 날짜: 가상 달력도 쓸 수 있도록 각 값은 숫자로만 저장 (연도가 없으면 미정) */
export interface StoryDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export const EMPTY_DATE: StoryDate = { year: null, month: null, day: null };

/** 기념일 등 이름 붙은 날짜 */
export interface DateEntry {
  id: string;
  label: string;
  date: StoryDate;
}

export interface Entity {
  id: string;
  kind: EntityKind;
  name: string;
  folderId: string | null;
  description: string;
  attributes: Attribute[];
  /** 사건 전용: 등장 인물 */
  characterIds: string[];
  /** 사건 전용: 배경 전환 순서 */
  placeIds: string[];
  /** 기념일 등 (모든 종류) */
  dates: DateEntry[];
  /** 사건 전용: 발생일 / 종료일 */
  startDate: StoryDate;
  endDate: StoryDate;
}

/** settings: 설정 페이지 폴더, relations: 관계 페이지 폴더 */
export type FolderScope = 'settings' | 'relations';

export interface Folder {
  id: string;
  scope: FolderScope;
  name: string;
  parentId: string | null;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  description: string;
}

export interface BoardNode {
  entityId: string;
  x: number;
  y: number;
}

/** 관계 그래프 보드: 전체 요소 중 일부만 골라 배치한 뷰 */
export interface Board {
  id: string;
  name: string;
  folderId: string | null;
  nodes: BoardNode[];
}

export interface StoryData {
  entities: Entity[];
  folders: Folder[];
  relations: Relation[];
  boards: Board[];
}

export const EMPTY_DATA: StoryData = { entities: [], folders: [], relations: [], boards: [] };
