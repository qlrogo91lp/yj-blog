import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeriodChangeBadge } from './period-change-badge';

describe('PeriodChangeBadge', () => {
  it('증가했으면 +부호와 함께 증가율을 보여준다', () => {
    render(<PeriodChangeBadge current={120} previous={100} />);
    expect(screen.getByText('+20%')).toBeInTheDocument();
  });

  it('감소했으면 부호 없이 음수 증가율을 보여준다', () => {
    render(<PeriodChangeBadge current={80} previous={100} />);
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('변동이 없으면 "변동 없음"을 보여준다', () => {
    render(<PeriodChangeBadge current={100} previous={100} />);
    expect(screen.getByText('변동 없음')).toBeInTheDocument();
  });

  it('직전 기간이 0이고 이번 기간도 0이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(
      <PeriodChangeBadge current={0} previous={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('직전 기간이 0이고 이번 기간이 0보다 크면 "신규"를 보여준다', () => {
    render(<PeriodChangeBadge current={5} previous={0} />);
    expect(screen.getByText('신규')).toBeInTheDocument();
  });
});
