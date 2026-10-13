import type { ReactNode } from 'react';

interface SidebarProps {
  /** 모바일에서 서랍 형태로 열림 여부 (데스크톱에서는 항상 표시) */
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sidebar({ open, onClose, children }: SidebarProps) {
  return (
    <>
      {open && <div className="backdrop" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>{children}</aside>
    </>
  );
}
