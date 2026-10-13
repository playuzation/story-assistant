import { useState, type ReactNode } from 'react';

export interface TreeFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface TreeLeaf {
  id: string;
  name: string;
  folderId: string | null;
}

interface FolderTreeProps {
  rootLabel: string;
  folders: TreeFolder[];
  leaves?: TreeLeaf[];
  leafIcon?: string;
  /** 선택된 폴더 또는 항목 id, null 이면 루트 */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  toolbar?: ReactNode;
}

/** 폴더(중첩)와 항목을 트리로 표시하는 범용 컴포넌트 */
export function FolderTree({
  rootLabel,
  folders,
  leaves = [],
  leafIcon = '•',
  selectedId,
  onSelect,
  toolbar,
}: FolderTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const itemClass = (id: string | null) => `tree-item${selectedId === id ? ' selected' : ''}`;
  const indent = (depth: number) => ({ paddingLeft: depth * 14 + 4 });

  const renderLevel = (parentId: string | null, depth: number): ReactNode => (
    <>
      {folders
        .filter((f) => f.parentId === parentId)
        .map((f) => (
          <li key={f.id}>
            <div className={itemClass(f.id)} style={indent(depth)}>
              <button type="button" className="tree-toggle" onClick={() => toggle(f.id)} aria-label="펼치기/접기">
                {collapsed.has(f.id) ? '▸' : '▾'}
              </button>
              <button type="button" className="tree-label" onClick={() => onSelect(f.id)}>
                📁 {f.name || '(이름 없음)'}
              </button>
            </div>
            {!collapsed.has(f.id) && <ul>{renderLevel(f.id, depth + 1)}</ul>}
          </li>
        ))}
      {leaves
        .filter((l) => l.folderId === parentId)
        .map((l) => (
          <li key={l.id}>
            <div className={itemClass(l.id)} style={indent(depth)}>
              <span className="tree-toggle" />
              <button type="button" className="tree-label" onClick={() => onSelect(l.id)}>
                {leafIcon} {l.name || '(이름 없음)'}
              </button>
            </div>
          </li>
        ))}
    </>
  );

  return (
    <nav className="tree">
      {toolbar && <div className="tree-toolbar">{toolbar}</div>}
      <ul>
        <li>
          <div className={itemClass(null)}>
            <button type="button" className="tree-label" onClick={() => onSelect(null)}>
              🗂 {rootLabel}
            </button>
          </div>
        </li>
        {renderLevel(null, 0)}
      </ul>
    </nav>
  );
}
