import { useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useStoryStore } from '../../store/index.ts';
import { FolderTree, Sidebar } from '../../shared/ui/index.ts';
import { BoardCanvas } from './BoardCanvas.tsx';
import './relations.css';

/** 관계 페이지: 폴더별 그래프 보드에서 요소 간 관계를 편집 */
export function RelationsPage() {
  const allFolders = useStoryStore((s) => s.folders);
  const boards = useStoryStore((s) => s.boards);
  const { addFolder, renameFolder, deleteFolder, addBoard, updateBoard, deleteBoard } = useStoryStore.getState();

  const folders = useMemo(() => allFolders.filter((f) => f.scope === 'relations'), [allFolders]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  const board = boards.find((b) => b.id === selectedId) ?? null;
  const folder = folders.find((f) => f.id === selectedId) ?? null;
  const currentFolderId = board ? board.folderId : selectedId;
  const openTree = () => setTreeOpen(true);

  const onAddFolder = () => {
    const name = window.prompt('새 폴더 이름');
    if (name?.trim()) setSelectedId(addFolder('relations', currentFolderId, name.trim()));
  };
  const onAddBoard = () => {
    const name = window.prompt('새 관계도 이름');
    if (name?.trim()) setSelectedId(addBoard(currentFolderId, name.trim()));
  };
  const onRename = () => {
    const target = board ?? folder;
    if (!target) return;
    const name = window.prompt('이름 변경', target.name);
    if (!name?.trim()) return;
    if (board) updateBoard(board.id, { name: name.trim() });
    else renameFolder(target.id, name.trim());
  };
  const onDelete = () => {
    if (board) {
      if (!window.confirm(`'${board.name}' 관계도를 삭제할까요? (요소와 관계 자체는 유지됩니다)`)) return;
      deleteBoard(board.id);
      setSelectedId(board.folderId);
    } else if (folder) {
      if (!window.confirm(`'${folder.name}' 폴더를 삭제할까요? 내용은 상위 폴더로 이동합니다.`)) return;
      deleteFolder(folder.id);
      setSelectedId(folder.parentId);
    }
  };

  const boardsInFolder = boards.filter((b) => b.folderId === currentFolderId);

  return (
    <div className="page">
      <Sidebar open={treeOpen} onClose={() => setTreeOpen(false)}>
        <FolderTree
          rootLabel="모든 관계도"
          folders={folders}
          leaves={boards}
          leafIcon="🕸"
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setTreeOpen(false);
          }}
          toolbar={
            <>
              <button type="button" onClick={onAddFolder}>+ 폴더</button>
              <button type="button" onClick={onAddBoard}>+ 관계도</button>
              <button type="button" onClick={onRename} disabled={!board && !folder}>이름 변경</button>
              <button type="button" onClick={onDelete} disabled={!board && !folder}>삭제</button>
            </>
          }
        />
      </Sidebar>

      {board ? (
        <ReactFlowProvider key={board.id}>
          <BoardCanvas board={board} onOpenTree={openTree} />
        </ReactFlowProvider>
      ) : (
        <main className="page-main board-list">
          <div className="row">
            <button type="button" className="mobile-only" onClick={openTree}>☰ 폴더</button>
            <strong>{folder?.name ?? '모든 관계도'}</strong>
            <button type="button" className="primary" onClick={onAddBoard}>+ 관계도</button>
          </div>
          {boardsInFolder.length === 0 ? (
            <p className="muted">
              관계도가 없습니다. 관계도를 만들고 설정 페이지의 요소를 올려 관계를 연결하세요.
            </p>
          ) : (
            <ul>
              {boardsInFolder.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setSelectedId(b.id)}>
                    🕸 {b.name} <span className="muted">({b.nodes.length}개 요소)</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}
    </div>
  );
}
