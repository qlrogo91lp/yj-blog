import { describe, expect, it } from 'vitest';
import {
  extractHostname,
  isDevTraffic,
  resolveReferrerGroup,
} from './referrer-group';

describe('extractHostname', () => {
  it('URL에서 호스트네임만 뽑는다', () => {
    expect(extractHostname('https://search.naver.com/search?q=a')).toBe(
      'search.naver.com'
    );
  });

  it('빈 문자열이면 빈 문자열을 돌려준다', () => {
    expect(extractHostname('')).toBe('');
  });

  it('URL이 아니면 빈 문자열을 돌려준다', () => {
    expect(extractHostname('not-a-url')).toBe('');
  });
});

describe('isDevTraffic', () => {
  it.each([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'macbook.local',
    '192.168.0.10',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.254',
  ])('%s는 개발 트래픽이다', (host) => {
    expect(isDevTraffic(host)).toBe(true);
  });

  it.each(['search.naver.com', 'www.google.com', 'yjlogs.com', '172.32.0.1'])(
    '%s는 개발 트래픽이 아니다',
    (host) => {
      expect(isDevTraffic(host)).toBe(false);
    }
  );

  it('빈 호스트네임은 개발 트래픽이 아니다', () => {
    expect(isDevTraffic('')).toBe(false);
  });
});

describe('resolveReferrerGroup', () => {
  it('네이버 하위 호스트를 한 그룹으로 묶는다', () => {
    const a = resolveReferrerGroup('m.search.naver.com');
    const b = resolveReferrerGroup('search.naver.com');

    expect(a.key).toBe(b.key);
    expect(a.label).toBe('네이버 검색');
    expect(a.letter).toBe('N');
  });

  it('구글을 인식한다', () => {
    const group = resolveReferrerGroup('www.google.com');
    expect(group.label).toBe('구글 검색');
    expect(group.letter).toBe('G');
  });

  it('빈 호스트네임은 직접 접근이다', () => {
    const group = resolveReferrerGroup('');
    expect(group.label).toBe('직접 접근');
    expect(group.letter).toBe('D');
  });

  it('자기 도메인은 내부 링크로 표시한다', () => {
    const group = resolveReferrerGroup('yjlogs.com', 'yjlogs.com');
    expect(group.label).toBe('내부 링크');
    expect(group.key).toBe('yjlogs.com');
  });

  it('자기 도메인의 www 변형도 내부 링크다', () => {
    expect(resolveReferrerGroup('www.yjlogs.com', 'yjlogs.com').label).toBe(
      '내부 링크'
    );
  });

  it('모르는 호스트는 호스트네임을 그대로 쓰고 첫 글자를 대문자로', () => {
    const group = resolveReferrerGroup('example.com');
    expect(group.key).toBe('example.com');
    expect(group.label).toBe('example.com');
    expect(group.letter).toBe('E');
  });
});
