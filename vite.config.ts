import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 상대 경로 base: GitHub Pages 하위 경로(/story-assistant/)에서도 동작
export default defineConfig({
  base: './',
  plugins: [react()],
});
