import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'globals.css'), 'utf-8');

/** 최상위 블록 하나를 잘라낸다. 닫는 중괄호가 항상 0열에 있는 포맷을 전제한다. */
function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`${selector} 블록을 찾을 수 없습니다`);
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}

/** `--name: oklch(L ...)` 에서 L 값을 뽑는다. */
function lightness(source: string, token: string): number {
  const matched = source.match(
    new RegExp(`${token}:\\s*oklch\\(([\\d.]+)`)
  );
  if (!matched) throw new Error(`${token} 의 oklch 값을 찾을 수 없습니다`);
  return Number(matched[1]);
}

const statusTokens = ['--status-published', '--status-draft', '--status-danger'];

describe('globals.css 어드민 토큰', () => {
  it('상태 색 토큰이 :root와 .dark 양쪽에 정의된다', () => {
    const root = block(':root');
    const dark = block('.dark');

    for (const token of statusTokens) {
      expect(root).toContain(`${token}:`);
      expect(dark).toContain(`${token}:`);
    }
  });

  it('상태 색 토큰이 Tailwind 유틸로 노출된다', () => {
    const theme = block('@theme inline');

    for (const token of statusTokens) {
      expect(theme).toContain(`--color-${token.slice(2)}: var(${token});`);
    }
  });

  it('라이트 모드 사이드바가 차콜이다', () => {
    expect(lightness(block(':root'), '--sidebar')).toBeLessThan(0.3);
  });

  it('라이트 모드 활성 항목이 흰 pill이다', () => {
    const root = block(':root');
    expect(lightness(root, '--sidebar-accent')).toBeGreaterThan(0.95);
    expect(lightness(root, '--sidebar-accent-foreground')).toBeLessThan(0.3);
  });

  it('다크 모드에서도 사이드바가 본문 배경보다 어둡다', () => {
    const dark = block('.dark');
    expect(lightness(dark, '--sidebar')).toBeLessThan(
      lightness(dark, '--background')
    );
  });
});
