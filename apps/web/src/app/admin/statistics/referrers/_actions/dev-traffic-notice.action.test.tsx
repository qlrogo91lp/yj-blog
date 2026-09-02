import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DevTrafficNoticeAction } from './dev-traffic-notice.action';

describe('DevTrafficNoticeAction', () => {
  it('개발 트래픽이 0이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<DevTrafficNoticeAction count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('접힌 상태의 안내 문구를 보여준다', () => {
    render(<DevTrafficNoticeAction count={112} />);
    expect(
      screen.getByText(/localhost·개발 트래픽 112회는 접어뒀습니다/)
    ).toBeInTheDocument();
  });

  it('펼치기를 누르면 설명이 열리고 버튼 라벨이 바뀐다', () => {
    render(<DevTrafficNoticeAction count={112} />);

    fireEvent.click(screen.getByRole('button', { name: '펼치기' }));

    expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
    expect(screen.getByText(/localhost·127\.0\.0\.1/)).toBeInTheDocument();
  });
});
