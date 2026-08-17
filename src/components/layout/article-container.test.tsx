import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleContainer } from './article-container';

describe('ArticleContainer', () => {
  it('children을 렌더링한다', () => {
    render(<ArticleContainer>내용</ArticleContainer>);
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('article-width max-width 클래스를 적용한다', () => {
    const { container } = render(<ArticleContainer>x</ArticleContainer>);
    expect(container.firstElementChild?.className).toContain(
      'max-w-[calc(var(--article-width)+2rem)]',
    );
  });

  it('전달한 className을 병합한다', () => {
    const { container } = render(<ArticleContainer className="py-8">x</ArticleContainer>);
    expect(container.firstElementChild?.className).toContain('py-8');
  });
});
