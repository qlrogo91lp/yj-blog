import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryWithCount } from '@/types';
import { CategoryCard } from './category-card';

vi.mock('../_components/category-actions-cell', () => ({
  CategoryActionsCell: () => <div data-testid="category-actions" />,
}));

const category: CategoryWithCount = {
  id: 1,
  name: '리뷰',
  slug: 'review',
  description: '제품 리뷰',
  createdAt: new Date('2026-01-01'),
  postCount: 3,
};

describe('CategoryCard', () => {
  it('이름·slug·설명·글 수를 렌더한다', () => {
    render(<CategoryCard category={category} />);

    expect(screen.getByText('리뷰')).toBeInTheDocument();
    expect(screen.getByText('/review')).toBeInTheDocument();
    expect(screen.getByText(/제품 리뷰/)).toBeInTheDocument();
    expect(screen.getByText(/글 3개/)).toBeInTheDocument();
  });

  it('설명이 없으면 글 수만 보여준다', () => {
    render(<CategoryCard category={{ ...category, description: null }} />);

    expect(screen.getByText('글 3개')).toBeInTheDocument();
    expect(screen.queryByText(/제품 리뷰/)).not.toBeInTheDocument();
  });

  it('수정·삭제 액션을 렌더한다', () => {
    render(<CategoryCard category={category} />);
    expect(screen.getByTestId('category-actions')).toBeInTheDocument();
  });
});
