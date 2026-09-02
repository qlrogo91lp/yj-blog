import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReferrerRow } from './referrer-row';

const row = {
  key: 'naver',
  label: '네이버 검색',
  letter: 'N',
  hosts: ['m.search.naver.com', 'search.naver.com'],
  count: 50,
  percentage: 3.9,
};

function renderRow(props = {}) {
  return render(
    <table>
      <tbody>
        <ReferrerRow row={{ ...row, ...props }} rank={2} />
      </tbody>
    </table>
  );
}

describe('ReferrerRow', () => {
  it('순위·letter 뱃지·그룹명·방문 수·비율을 렌더한다', () => {
    renderRow();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('네이버 검색')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('3.9%')).toBeInTheDocument();
  });

  it('하위 호스트를 가운뎃점으로 이어 보조 라인에 보여준다', () => {
    renderRow();
    expect(
      screen.getByText('m.search.naver.com · search.naver.com')
    ).toBeInTheDocument();
  });

  it('하위 호스트가 그룹명과 같으면 보조 라인을 생략한다', () => {
    renderRow({ label: 'example.com', hosts: ['example.com'] });
    expect(
      screen.queryByText('example.com', { selector: 'span.text-xs' })
    ).not.toBeInTheDocument();
  });

  it('하위 호스트가 없으면 보조 라인이 없다', () => {
    renderRow({ key: 'direct', label: '직접 접근', letter: 'D', hosts: [] });
    expect(screen.getByText('직접 접근')).toBeInTheDocument();
  });
});
