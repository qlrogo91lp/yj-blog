export type ReferrerGroup = {
  key: string;
  label: string;
  letter: string;
};

/** URL 문자열에서 호스트네임만 뽑는다. 파싱 실패·빈 값이면 빈 문자열. */
export function extractHostname(referrer: string): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname;
  } catch {
    return '';
  }
}

const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
const PRIVATE_IP =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

/** 로컬 개발 환경에서 발생한 유입인지 판별한다. */
export function isDevTraffic(hostname: string): boolean {
  if (!hostname) return false;
  if (DEV_HOSTS.has(hostname)) return true;
  if (hostname.endsWith('.local')) return true;
  return PRIVATE_IP.test(hostname);
}

/** 하위 호스트를 하나로 묶을 알려진 서비스들 */
const KNOWN_SERVICES: { match: RegExp; key: string; label: string; letter: string }[] =
  [
    { match: /(^|\.)naver\.com$/, key: 'naver', label: '네이버 검색', letter: 'N' },
    { match: /(^|\.)google\.[a-z.]+$/, key: 'google', label: '구글 검색', letter: 'G' },
    { match: /(^|\.)daum\.net$/, key: 'daum', label: '다음 검색', letter: 'D' },
    { match: /(^|\.)bing\.com$/, key: 'bing', label: 'Bing 검색', letter: 'B' },
    { match: /(^|\.)(x|twitter)\.com$|^t\.co$/, key: 'x', label: 'X (Twitter)', letter: 'X' },
    { match: /(^|\.)facebook\.com$/, key: 'facebook', label: 'Facebook', letter: 'F' },
    { match: /(^|\.)github\.com$/, key: 'github', label: 'GitHub', letter: 'G' },
    { match: /(^|\.)news\.ycombinator\.com$/, key: 'hn', label: 'Hacker News', letter: 'H' },
  ];

/**
 * 호스트네임을 표시용 그룹으로 정규화한다.
 * siteHostname을 주면 자기 도메인을 "내부 링크"로 묶는다.
 */
export function resolveReferrerGroup(
  hostname: string,
  siteHostname?: string
): ReferrerGroup {
  if (!hostname) {
    return { key: 'direct', label: '직접 접근', letter: 'D' };
  }

  if (siteHostname) {
    const bare = siteHostname.replace(/^www\./, '');
    if (hostname === bare || hostname === `www.${bare}`) {
      return { key: bare, label: '내부 링크', letter: bare[0].toUpperCase() };
    }
  }

  const known = KNOWN_SERVICES.find((service) => service.match.test(hostname));
  if (known) {
    return { key: known.key, label: known.label, letter: known.letter };
  }

  return {
    key: hostname,
    label: hostname,
    letter: hostname[0].toUpperCase(),
  };
}
