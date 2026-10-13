import type { ReactNode } from 'react';

interface DetailPanelProps {
  title: string;
  onClose: () => void;
  /** 모바일 표시 방식: full = 전체 화면, sheet = 하단 시트 */
  variant?: 'full' | 'sheet';
  children: ReactNode;
}

export function DetailPanel({ title, onClose, variant = 'full', children }: DetailPanelProps) {
  return (
    <aside className={`detail-panel ${variant}`}>
      <header className="detail-header">
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </header>
      <div className="detail-body">{children}</div>
    </aside>
  );
}
