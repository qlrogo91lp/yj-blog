import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterCounter } from './character-counter';

describe('CharacterCounter', () => {
  it('현재 글자수와 권장 최대를 "n / max" 형식으로 표시한다', () => {
    render(<CharacterCounter value="안녕하세요" recommendedMax={60} />);
    expect(screen.getByText('5 / 60')).toBeInTheDocument();
  });

  it('권장 범위 내일 때 muted 색상 클래스를 가진다', () => {
    const { container } = render(
      <CharacterCounter value="짧음" recommendedMax={60} />,
    );
    expect(container.firstChild).toHaveClass('text-muted-foreground');
  });

  it('권장 초과 시 yellow 색상 클래스를 가진다', () => {
    const { container } = render(
      <CharacterCounter value={'가'.repeat(61)} recommendedMax={60} />,
    );
    expect(container.firstChild).toHaveClass('text-yellow-600');
  });

  it('hardMax 초과 시 destructive 색상 클래스를 가진다', () => {
    const { container } = render(
      <CharacterCounter value={'가'.repeat(101)} recommendedMax={60} hardMax={100} />,
    );
    expect(container.firstChild).toHaveClass('text-destructive');
  });
});
