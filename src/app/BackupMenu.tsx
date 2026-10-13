import { useRef } from 'react';
import { parseStoryData } from '../domain/index.ts';
import { getStoryData, useStoryStore } from '../store/index.ts';

/** 데이터는 브라우저(localStorage)에만 저장되므로 JSON 파일로 백업/복원 */
export function BackupMenu() {
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob([JSON.stringify(getStoryData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-assistant-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = parseStoryData(JSON.parse(await file.text()));
      if (window.confirm('현재 데이터를 가져온 파일로 덮어쓸까요?')) useStoryStore.getState().replaceData(data);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '파일을 읽지 못했습니다.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="row backup-menu">
      <button type="button" onClick={onExport}>내보내기</button>
      <button type="button" onClick={() => fileRef.current?.click()}>가져오기</button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void onImport(e.target.files?.[0])}
      />
    </div>
  );
}
