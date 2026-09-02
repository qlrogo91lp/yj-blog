import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminMainContainerHandler } from './admin-main-container.handler';

const pathname = vi.hoisted(() => ({ current: '/admin/categories' }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

describe('AdminMainContainerHandler', () => {
  it('일반 화면에서는 자식을 max-w-360 mx-auto 컨테이너로 감싼다', () => {
    pathname.current = '/admin/categories';
    render(
      <AdminMainContainerHandler>
        <div data-testid="content">내용</div>
      </AdminMainContainerHandler>
    );

    expect(screen.getByTestId('content').parentElement).toHaveClass(
      'mx-auto',
      'max-w-360'
    );
  });

  it('새 글 작성 화면에서는 폭 제한 컨테이너 없이 자식을 그대로 렌더한다', () => {
    pathname.current = '/admin/posts/new';
    render(
      <AdminMainContainerHandler>
        <div data-testid="content">내용</div>
      </AdminMainContainerHandler>
    );

    expect(screen.getByTestId('content').parentElement).not.toHaveClass(
      'max-w-360'
    );
  });

  it('글 수정 화면에서도 폭 제한 컨테이너 없이 자식을 그대로 렌더한다', () => {
    pathname.current = '/admin/posts/12/edit';
    render(
      <AdminMainContainerHandler>
        <div data-testid="content">내용</div>
      </AdminMainContainerHandler>
    );

    expect(screen.getByTestId('content').parentElement).not.toHaveClass(
      'max-w-360'
    );
  });
});
