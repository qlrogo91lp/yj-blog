import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostContentAction } from './post-content.action';
import { GalleryNavHandler } from '../_handlers/gallery-nav.handler';

const galleryHtml =
  '<div data-gallery><figure><img src="a.png" alt="가" width="10" height="10"></figure><figure><img src="b.png" alt="나" width="10" height="10"></figure></div>';

// PostContentAction을 통째로 unmount하면 dangerouslySetInnerHTML을 가진 컨테이너 div 자체가
// React에 의해 DOM에서 제거되므로, GalleryNavHandler 단독의 cleanup(복원 로직)을 검증할 수 없다.
// 컨테이너는 유지한 채 GalleryNavHandler만 뗐다 붙였다 할 수 있는 최소 래퍼로 그 부분만 따로 검증한다.
function GalleryNavHandlerTestWrapper({ mounted }: { mounted: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: galleryHtml }} />
      {mounted && <GalleryNavHandler containerRef={containerRef} />}
    </div>
  );
}

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

  describe('갤러리 내비게이션', () => {
    it('갤러리를 [data-gallery-wrap]으로 감싼다', () => {
      const { container } = render(<PostContentAction html={galleryHtml} />);
      expect(container.querySelector('[data-gallery-wrap]')).toBeInTheDocument();
    });

    it('이전/다음 사진 버튼을 생성한다', () => {
      const { container } = render(<PostContentAction html={galleryHtml} />);
      // 버튼이 초기 상태에서 hidden 처리될 수 있어(스크롤 불필요) 접근성 이름이 아닌
      // aria-label 속성으로 직접 존재 여부를 확인한다.
      expect(container.querySelector('button[aria-label="이전 사진"]')).toBeInTheDocument();
      expect(container.querySelector('button[aria-label="다음 사진"]')).toBeInTheDocument();
    });

    it('unmount 시 wrap과 버튼을 제거하고 갤러리를 원래 위치로 복원한다', () => {
      const { container, rerender } = render(<GalleryNavHandlerTestWrapper mounted={true} />);
      expect(container.querySelector('[data-gallery-wrap]')).toBeInTheDocument();

      rerender(<GalleryNavHandlerTestWrapper mounted={false} />);

      expect(container.querySelector('[data-gallery-wrap]')).not.toBeInTheDocument();
      expect(container.querySelector('button[aria-label="이전 사진"]')).not.toBeInTheDocument();
      expect(container.querySelector('button[aria-label="다음 사진"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-gallery]')).toBeInTheDocument();
    });
  });
});
