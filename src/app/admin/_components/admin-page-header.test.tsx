import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminPageHeader } from './admin-page-header';

describe('AdminPageHeader', () => {
  it('타이틀을 h1으로 렌더한다', () => {
    render(<AdminPageHeader title="카테고리" />);
    expect(screen.getByRole('heading', { level: 1, name: '카테고리' })).toBeInTheDocument();
  });

  it('설명을 함께 렌더한다', () => {
    render(
      <AdminPageHeader title="카테고리" description="글 3개가 카테고리에 묶여 있습니다" />
    );
    expect(
      screen.getByText('글 3개가 카테고리에 묶여 있습니다')
    ).toBeInTheDocument();
  });

  it('설명이 없으면 설명 영역을 렌더하지 않는다', () => {
    const { container } = render(<AdminPageHeader title="카테고리" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('우측 액션 슬롯을 렌더한다', () => {
    render(
      <AdminPageHeader
        title="카테고리"
        action={<button type="button">새 카테고리</button>}
      />
    );
    expect(
      screen.getByRole('button', { name: '새 카테고리' })
    ).toBeInTheDocument();
  });
});
