import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewPostStore } from '../_store';
import { CategorySelectorAction } from './category-selector.action';

vi.mock('../_services/save-post', () => ({ savePost: vi.fn() }));

const categories = [
  {
    id: 1,
    name: '개발',
    slug: 'dev',
    description: null,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: '일상',
    slug: 'life',
    description: null,
    createdAt: new Date(),
  },
];

describe('CategorySelectorAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('선택된 카테고리가 없으면 "카테고리 없음"을 표시한다', () => {
    render(<CategorySelectorAction categories={categories} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('카테고리 없음');
  });

  it('선택된 카테고리 이름을 표시한다', () => {
    useNewPostStore.getState().setCategoryId(2);
    render(<CategorySelectorAction categories={categories} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('일상');
  });
});
