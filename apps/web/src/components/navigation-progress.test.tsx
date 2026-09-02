import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationProgress, shouldStartProgress } from './navigation-progress';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

/** 지정한 href를 가진 앵커를 document에 붙이고 반환한다. */
function appendAnchor(
  href: string,
  attrs: Record<string, string> = {}
): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = href;
  for (const [key, value] of Object.entries(attrs))
    anchor.setAttribute(key, value);
  document.body.appendChild(anchor);
  return anchor;
}

/** 좌클릭 MouseEvent를 만든다. */
function leftClick(init: MouseEventInit = {}): MouseEvent {
  return new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
}

describe('shouldStartProgress', () => {
  it('내부 링크 좌클릭은 추적한다', () => {
    const anchor = appendAnchor('/posts');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(true);
  });

  it('앵커가 없으면 추적하지 않는다', () => {
    expect(shouldStartProgress(leftClick(), null, '/')).toBe(false);
  });

  it('수정키를 누른 클릭은 새 탭/창이므로 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts');
    expect(shouldStartProgress(leftClick({ metaKey: true }), anchor, '/')).toBe(
      false
    );
    expect(shouldStartProgress(leftClick({ ctrlKey: true }), anchor, '/')).toBe(
      false
    );
    expect(
      shouldStartProgress(leftClick({ shiftKey: true }), anchor, '/')
    ).toBe(false);
    expect(shouldStartProgress(leftClick({ altKey: true }), anchor, '/')).toBe(
      false
    );
  });

  it('가운데 클릭은 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts');
    expect(shouldStartProgress(leftClick({ button: 1 }), anchor, '/')).toBe(
      false
    );
  });

  it('외부 링크는 추적하지 않는다', () => {
    const anchor = appendAnchor('https://example.com/page');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('target="_blank"는 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts', { target: '_blank' });
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('download 속성이 있으면 추적하지 않는다', () => {
    const anchor = appendAnchor('/files/a.pdf', { download: '' });
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('같은 문서 내 해시 링크는 추적하지 않는다', () => {
    const anchor = appendAnchor('/#section');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('현재 경로와 동일한 링크 재클릭은 추적하지 않는다', () => {
    const anchor = appendAnchor('/');
    expect(shouldStartProgress(leftClick(), anchor, '/')).toBe(false);
  });

  it('이미 preventDefault된 이벤트는 추적하지 않는다', () => {
    const anchor = appendAnchor('/posts');
    const event = leftClick();
    event.preventDefault();
    expect(shouldStartProgress(event, anchor, '/')).toBe(false);
  });
});

describe('NavigationProgress', () => {
  beforeEach(() => {
    // setTimeout만 가짜로 만든다. useNProgress는 requestAnimationFrame으로
    // 트리클·페이드아웃을 돌리고 React도 자체 스케줄링을 쓰므로, 전부 가로채면
    // 렌더가 멈춰 테스트가 불안정해진다. 우리가 제어할 대상은 150ms 지연뿐이다.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기에는 숨겨져 있다', () => {
    render(<NavigationProgress />);
    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '0',
    });
  });

  it('클릭 후 150ms 전에는 나타나지 않는다', () => {
    render(<NavigationProgress />);
    const anchor = appendAnchor('/posts');

    act(() => {
      anchor.dispatchEvent(leftClick());
      vi.advanceTimersByTime(149);
    });

    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '0',
    });
  });

  it('클릭 후 150ms가 지나면 나타난다', () => {
    render(<NavigationProgress />);
    const anchor = appendAnchor('/posts');

    act(() => {
      anchor.dispatchEvent(leftClick());
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '1',
    });
  });

  it('제외 대상 클릭은 150ms가 지나도 나타나지 않는다', () => {
    render(<NavigationProgress />);
    const anchor = appendAnchor('https://example.com/page');

    act(() => {
      anchor.dispatchEvent(leftClick());
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('navigation-progress')).toHaveStyle({
      opacity: '0',
    });
  });
});
