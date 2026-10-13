/** 관계도 오른쪽(모바일: 하단) 패널에 표시할 대상 */
export type PanelState = { type: 'node' | 'edge'; id: string } | { type: 'board' } | null;
