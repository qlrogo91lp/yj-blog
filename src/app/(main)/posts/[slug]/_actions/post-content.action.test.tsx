import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostContentAction } from './post-content.action';

describe('PostContentAction', () => {
  it('전달된 HTML을 렌더한다', () => {
    render(<PostContentAction html='<p>본문 단락</p>' />);
    expect(screen.getByText('본문 단락')).toBeInTheDocument();
  });

  it('이미지 클릭 시 확대 다이얼로그가 열린다', () => {
    render(<PostContentAction html='<img src="/test.jpg" alt="테스트 이미지" />' />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const imgs = screen.getAllByAltText('테스트 이미지');
    fireEvent.click(imgs[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // 다이얼로그 내부에도 동일 alt 이미지가 존재(본문 + 확대본 = 2개)
    expect(screen.getAllByAltText('테스트 이미지').length).toBeGreaterThanOrEqual(2);
  });

  it('드래그한 뒤 뗀 클릭은 확대하지 않는다', () => {
    render(<PostContentAction html='<img src="/test.jpg" alt="테스트 이미지" />' />);
    const img = screen.getAllByAltText('테스트 이미지')[0];
    fireEvent.pointerDown(img, { clientX: 0, clientY: 0 });
    fireEvent.click(img, { clientX: 40, clientY: 0 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('제자리 클릭은 확대한다', () => {
    render(<PostContentAction html='<img src="/test.jpg" alt="테스트 이미지" />' />);
    const img = screen.getAllByAltText('테스트 이미지')[0];
    fireEvent.pointerDown(img, { clientX: 10, clientY: 10 });
    fireEvent.click(img, { clientX: 11, clientY: 11 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
