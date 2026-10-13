import { useEffect, useState } from 'react';
import { SettingsPage } from '../features/settings/index.ts';
import { RelationsPage } from '../features/relations/index.ts';
import { BackupMenu } from './BackupMenu.tsx';
import './app.css';

type Route = 'settings' | 'relations';

// GitHub Pages 에서 새로고침해도 404 가 나지 않도록 해시 기반 라우팅 사용
const readRoute = (): Route => (window.location.hash === '#/relations' ? 'relations' : 'settings');

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Story Assistant</h1>
        <nav className="app-nav">
          <a href="#/settings" className={route === 'settings' ? 'active' : ''}>설정</a>
          <a href="#/relations" className={route === 'relations' ? 'active' : ''}>관계도</a>
        </nav>
        <BackupMenu />
      </header>
      <div className="app-content">{route === 'settings' ? <SettingsPage /> : <RelationsPage />}</div>
    </div>
  );
}
