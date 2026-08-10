import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

/** next.config의 headers()에서 최상위 CSP 문자열을 꺼낸다. */
async function getCspHeaderValue(): Promise<string> {
  const headers = await nextConfig.headers!();
  const rule = headers.find((h) => h.source === '/(.*)');
  if (!rule) throw new Error('전역 헤더 규칙(/(.*))을 찾을 수 없습니다');
  const csp = rule.headers.find((h) => h.key === 'Content-Security-Policy');
  if (!csp) throw new Error('Content-Security-Policy 헤더를 찾을 수 없습니다');
  return csp.value;
}

/** CSP 문자열에서 특정 지시어의 소스 목록을 파싱한다. */
function getDirective(csp: string, name: string): string[] {
  const directive = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `));
  if (!directive) throw new Error(`${name} 지시어를 찾을 수 없습니다`);
  return directive.split(/\s+/).slice(1);
}

describe('next.config CSP', () => {
  it('script-src가 Google Tag Manager를 허용한다', async () => {
    const csp = await getCspHeaderValue();
    expect(getDirective(csp, 'script-src')).toContain('https://www.googletagmanager.com');
  });

  it('connect-src가 Google Analytics 수집 엔드포인트를 허용한다', async () => {
    const csp = await getCspHeaderValue();
    const connectSrc = getDirective(csp, 'connect-src');
    expect(connectSrc).toContain('https://*.google-analytics.com');
    expect(connectSrc).toContain('https://*.analytics.google.com');
  });

  it('기존 Clerk 허용 항목이 유지된다', async () => {
    const csp = await getCspHeaderValue();
    const scriptSrc = getDirective(csp, 'script-src');
    expect(scriptSrc).toContain('https://clerk.yjlogs.com');
    expect(scriptSrc).toContain("'self'");
  });
});
