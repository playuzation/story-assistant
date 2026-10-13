import { useRef } from 'react';
import { EMPTY_DATA, STORY_FILE_EXTENSION, fromStoryFile, storyFileName, toStoryFile, type StoryData } from '../domain/index.ts';
import { getStoryData, useStoryStore } from '../store/index.ts';

const DISCARD_NOTICE = '지금 작업 중인 이야기는 사라지니 필요하면 먼저 파일로 저장하세요.';

interface StoryMenuProps {
  /** 이야기를 통째로 바꾼 뒤 호출 (페이지의 선택 상태 초기화용) */
  onReplace: () => void;
}

/** 이야기 정보 편집과 파일 저장/불러오기 (이야기 하나 = 파일 하나) */
export function StoryMenu({ onReplace }: StoryMenuProps) {
  const story = useStoryStore((s) => s.story);
  const { updateStory, replaceData } = useStoryStore.getState();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const replace = (data: StoryData) => {
    replaceData(data);
    onReplace();
    dialogRef.current?.close();
  };

  const onSave = () => {
    const json = JSON.stringify(toStoryFile(getStoryData()), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = storyFileName(story.title);
    a.click();
    // 일부 브라우저는 다운로드 시작 전에 URL 을 해제하면 실패하므로 잠시 뒤 해제
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onOpen = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { data, warnings } = fromStoryFile(JSON.parse(await file.text()));
      if (!window.confirm(`'${data.story.title || file.name}'을(를) 불러올까요?\n${DISCARD_NOTICE}`)) return;
      replace(data);
      if (warnings.length > 0) window.alert(`불러오면서 정리한 내용이 있습니다.\n- ${warnings.join('\n- ')}`);
    } catch (e) {
      const message = e instanceof SyntaxError ? 'JSON 형식이 올바르지 않은 파일입니다.' : e instanceof Error ? e.message : '';
      window.alert(`파일을 불러오지 못했습니다.\n${message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onNew = () => {
    if (window.confirm(`새 이야기를 시작할까요?\n${DISCARD_NOTICE}`)) replace(EMPTY_DATA);
  };

  return (
    <>
      <button type="button" className="story-button" onClick={() => dialogRef.current?.showModal()}>
        📖 <span className="story-button-title">{story.title || '제목 없는 이야기'}</span>
      </button>
      <dialog ref={dialogRef} className="story-dialog">
        <header className="detail-header">
          <h2>이야기</h2>
          <button type="button" className="icon-button" aria-label="닫기" onClick={() => dialogRef.current?.close()}>
            ✕
          </button>
        </header>
        <div className="detail-body">
          <label className="field">
            제목
            <input value={story.title} onChange={(e) => updateStory({ title: e.target.value })} />
          </label>
          <label className="field">
            설명
            <textarea value={story.description} onChange={(e) => updateStory({ description: e.target.value })} />
          </label>
          <div className="row">
            <button type="button" className="primary" onClick={onSave}>
              파일로 저장
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              불러오기
            </button>
            <button type="button" onClick={onNew}>
              새 이야기
            </button>
          </div>
          <p className="muted">
            작업 내용은 이 브라우저에 자동 저장됩니다. 백업하거나 다른 기기로 옮기려면 파일({STORY_FILE_EXTENSION})로 저장하세요.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => void onOpen(e.target.files?.[0])}
          />
        </div>
      </dialog>
    </>
  );
}
