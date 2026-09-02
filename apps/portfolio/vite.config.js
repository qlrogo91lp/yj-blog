import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// `<!-- include: src/components/foo.html -->` 를 파일 내용으로 치환한다.
// 치환된 내용 안의 include 지시어도 처리하도록 재귀한다 (파티셜 안의 SVG include용).
function includePlugin() {
  const pattern = /<!--\s*include:\s*(.+?)\s*-->/g;
  function expand(html, depth = 0) {
    if (depth > 5) return html;
    return html.replace(pattern, (match, filePath) => {
      const fullPath = resolve(__dirname, filePath);
      try {
        return expand(readFileSync(fullPath, 'utf-8'), depth + 1);
      } catch (error) {
        console.error(`Failed to include ${fullPath}:`, error.message);
        return match;
      }
    });
  }
  return {
    name: 'include-plugin',
    transformIndexHtml(html) {
      return expand(html);
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  base: './',
  plugins: [tailwindcss(), includePlugin()],
});
