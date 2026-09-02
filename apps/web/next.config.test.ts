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

describe('next.config images', () => {
  it('minimumCacheTTL이 1년으로 설정된다', () => {
    // R2 원본이 Cache-Control을 보내지 않아 Next 기본값(4시간)으로 폴백하던 문제.
    // 업로드 경로가 타임스탬프 기반이라 같은 URL에 다른 내용이 덮이지 않으므로
    // 1년이 안전하다.
    expect(nextConfig.images?.minimumCacheTTL).toBe(31536000);
  });

  it('deviceSizes를 4종으로 축소해 콜드 미스 표면을 줄인다', () => {
    // 콘텐츠 폭이 980px이라 2x DPI를 감안해도 1920px 초과 변형은 쓰이지 않는다.
    expect(nextConfig.images?.deviceSizes).toEqual([640, 828, 1080, 1920]);
  });

  it('imageSizes는 변경하지 않는다', () => {
    expect(nextConfig.images?.imageSizes).toBeUndefined();
  });

  it('기존 remotePatterns가 유지된다', () => {
    const hostnames = nextConfig.images?.remotePatterns?.map((p) => p.hostname);
    expect(hostnames).toContain('assets.yjlogs.com');
  });
});
