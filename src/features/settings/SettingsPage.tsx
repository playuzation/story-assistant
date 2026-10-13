import { useMemo, useState } from 'react';
import { ENTITY_KINDS, KIND_LABEL, descendantFolderIds, type EntityKind } from '../../domain/index.ts';
import { useStoryStore } from '../../store/index.ts';
import { DetailPanel, FolderTree, KindBadge, Sidebar } from '../../shared/ui/index.ts';
import { EntityEditor } from './EntityEditor.tsx';
import './settings.css';

type KindFilter = EntityKind | 'all';

/** 설정 페이지: 폴더별로 인물/사건/배경/물건 설정을 관리 */
export function SettingsPage() {
  const allFolders = useStoryStore((s) => s.folders);
  const entities = useStoryStore((s) => s.entities);
  const { addFolder, renameFolder, deleteFolder, addEntity } = useStoryStore.getState();

  const folders = useMemo(() => allFolders.filter((f) => f.scope === 'settings'), [allFolders]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [kind, setKind] = useState<KindFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  const currentFolder = folders.find((f) => f.id === folderId) ?? null;
  const visible = useMemo(() => {
    const scope = folderId ? descendantFolderIds(folders, folderId) : null;
    return entities.filter(
      (e) => (kind === 'all' || e.kind === kind) && (!scope || (e.folderId !== null && scope.has(e.folderId))),
    );
  }, [entities, folders, folderId, kind]);
  const editing = entities.find((e) => e.id === editingId) ?? null;

  const onAddFolder = () => {
    const name = window.prompt('새 폴더 이름');
    if (name?.trim()) setFolderId(addFolder('settings', folderId, name.trim()));
  };
  const onRenameFolder = () => {
    if (!currentFolder) return;
    const name = window.prompt('폴더 이름 변경', currentFolder.name);
    if (name?.trim()) renameFolder(currentFolder.id, name.trim());
  };
  const onDeleteFolder = () => {
    if (!currentFolder) return;
    if (!window.confirm(`'${currentFolder.name}' 폴더를 삭제할까요? 내용은 상위 폴더로 이동합니다.`)) return;
    deleteFolder(currentFolder.id);
    setFolderId(currentFolder.parentId);
  };

  return (
    <div className="page">
      <Sidebar open={treeOpen} onClose={() => setTreeOpen(false)}>
        <FolderTree
          rootLabel="전체"
          folders={folders}
          selectedId={folderId}
          onSelect={(id) => {
            setFolderId(id);
            setTreeOpen(false);
          }}
          toolbar={
            <>
              <button type="button" onClick={onAddFolder}>+ 폴더</button>
              <button type="button" onClick={onRenameFolder} disabled={!currentFolder}>이름 변경</button>
              <button type="button" onClick={onDeleteFolder} disabled={!currentFolder}>삭제</button>
            </>
          }
        />
      </Sidebar>

      <main className="page-main settings-main">
        <div className="row settings-toolbar">
          <button type="button" className="mobile-only" onClick={() => setTreeOpen(true)}>☰ 폴더</button>
          <strong className="settings-folder-name">{currentFolder?.name ?? '전체'}</strong>
        </div>
        <div className="row kind-tabs">
          {(['all', ...ENTITY_KINDS] as KindFilter[]).map((k) => (
            <button key={k} type="button" className={kind === k ? 'primary' : ''} onClick={() => setKind(k)}>
              {k === 'all' ? '전체' : KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="row">
          {ENTITY_KINDS.map((k) => (
            <button key={k} type="button" onClick={() => setEditingId(addEntity(k, folderId))}>
              + {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="muted">이 폴더에 항목이 없습니다. 위 버튼으로 추가하세요.</p>
        ) : (
          <ul className="entity-list">
            {visible.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={`entity-card${e.id === editingId ? ' selected' : ''}`}
                  onClick={() => setEditingId(e.id)}
                >
                  <span className="row">
                    <KindBadge kind={e.kind} />
                    <strong>{e.name || '(이름 없음)'}</strong>
                  </span>
                  {e.description && <span className="muted entity-desc">{e.description}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editing && (
        <DetailPanel title={`${KIND_LABEL[editing.kind]} 설정`} onClose={() => setEditingId(null)}>
          <EntityEditor key={editing.id} entity={editing} onDeleted={() => setEditingId(null)} />
        </DetailPanel>
      )}
    </div>
  );
}
