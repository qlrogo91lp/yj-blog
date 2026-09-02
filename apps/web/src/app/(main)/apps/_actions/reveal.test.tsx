import { render, screen } from '@testing-library/react';
import { Reveal } from './reveal.action';

describe('Reveal', () => {
  it('children을 렌더한다', () => {
    render(
      <Reveal>
        <p>등장 대상</p>
      </Reveal>,
    );
    expect(screen.getByText('등장 대상')).toBeInTheDocument();
  });

  it('className을 전달한다', () => {
    render(
      <Reveal className="max-w-160">
        <p>본문</p>
      </Reveal>,
    );
    expect(screen.getByText('본문').parentElement).toHaveClass('max-w-160');
  });
});
