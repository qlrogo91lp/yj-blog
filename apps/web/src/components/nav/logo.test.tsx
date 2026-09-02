import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo, LogoMark } from './logo';

describe('Logo', () => {
  it('LogoMark는 currentColor를 사용하는 svg를 렌더한다', () => {
    const { container } = render(<LogoMark className="size-4" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveClass('size-4');
  });

  it('Logo는 원형 배경 컨테이너 안에 마크를 렌더한다', () => {
    render(<Logo />);
    const mark = screen.getByLabelText('YJlogs 로고');
    expect(mark).toHaveClass('rounded-full');
  });
});
