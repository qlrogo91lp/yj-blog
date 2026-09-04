// astro preview를 띄우고 Chrome 헤드리스로 A4 PDF를 만든다.
// file:// 로 열면 crossorigin 속성 때문에 CSS가 막히므로 반드시 HTTP로 연다.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const port = 4173;
const out = resolve(root, 'dist/portfolio.pdf');
const chrome =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!existsSync(chrome)) {
  console.error(
    `Chrome을 찾을 수 없습니다: ${chrome}\nCHROME_PATH 환경변수로 경로를 지정하세요.`
  );
  process.exit(1);
}

const preview = spawn(
  'pnpm',
  ['exec', 'astro', 'preview', '--port', String(port), '--strictPort'],
  {
    cwd: root,
    stdio: 'ignore',
  }
);

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview 서버가 ${url} 에서 응답하지 않습니다`);
}

try {
  await waitForServer(`http://localhost:${port}/`);
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      // 페이지 폭은 뷰포트 폭을 그대로 쓴다. 페이지 안 스크립트가 이 폭에서 잰
      // 문서 높이로 @page 크기를 잡으므로 둘이 어긋나지 않는다.
      '--window-size=900,1200',
      '--hide-scrollbars',
      '--virtual-time-budget=8000',
      `--print-to-pdf=${out}`,
      `http://localhost:${port}/?print=1`,
    ],
    { stdio: 'ignore' }
  );
  const pages = (
    readFileSync(out)
      .toString('latin1')
      .match(/\/Type\s*\/Page[^s]/g) ?? []
  ).length;
  console.log(`${out}\n${pages} pages`);
} finally {
  preview.kill();
}
