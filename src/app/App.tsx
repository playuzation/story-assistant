import { createElement, useEffect, useState } from 'react';
import { SettingsPage } from '../features/settings/index.ts';
import { RelationsPage } from '../features/relations/index.ts';
import { TimelinePage } from '../features/timeline/index.ts';
import { BackupMenu } from './BackupMenu.tsx';
import './app.css';

const PAGES = {
  settings: { label: '설정', Page: SettingsPage },
  relations: { label: '관계도', Page: RelationsPage },
  timeline: { label: '타임라인', Page: TimelinePage },
};

type Route = keyof typeof PAGES;

// GitHub Pages 에서 새로고침해도 404 가 나지 않도록 해시 기반 라우팅 사용
const readRoute = (): Route => {
  const route = window.location.hash.replace('#/', '');
  return Object.hasOwn(PAGES, route) ? (route as Route) : 'settings';
};

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
          {(Object.keys(PAGES) as Route[]).map((key) => (
            <a key={key} href={`#/${key}`} className={route === key ? 'active' : ''}>
              {PAGES[key].label}
            </a>
          ))}
        </nav>
        <BackupMenu />
      </header>
      <div className="app-content">{createElement(PAGES[route].Page)}</div>
    </div>
  );
}
