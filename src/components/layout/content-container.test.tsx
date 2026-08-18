import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentContainer } from './content-container';

describe('ContentContainer', () => {
  it('children을 렌더링한다', () => {
    render(<ContentContainer>내용</ContentContainer>);
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('content-width max-width 클래스를 적용한다', () => {
    const { container } = render(<ContentContainer>x</ContentContainer>);
    expect(container.firstElementChild?.className).toContain(
      'max-w-[calc(var(--content-width)+2rem)]',
    );
  });

  it('전달한 className을 병합한다', () => {
    const { container } = render(<ContentContainer className="py-6">x</ContentContainer>);
    expect(container.firstElementChild?.className).toContain('py-6');
  });
});
