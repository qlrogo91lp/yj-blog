import { render, screen } from '@testing-library/react';
import { GolfStatChip } from './golf-stat-chip';

describe('GolfStatChip', () => {
  it('라벨과 값을 렌더한다', () => {
    render(<GolfStatChip chip={{ id: 'total', label: 'TOTAL', value: '46', tone: 'green' }} />);
    expect(screen.getByText('TOTAL')).toBeInTheDocument();
    expect(screen.getByText('46')).toBeInTheDocument();
  });

  it('suffix가 있으면 값 옆에 함께 렌더한다', () => {
    render(
      <GolfStatChip
        chip={{ id: 'putts', label: 'PUTTS', value: '1.8', suffix: '/hole', tone: 'fg' }}
      />,
    );
    expect(screen.getByText('/hole')).toBeInTheDocument();
  });

  it('suffix가 없으면 렌더하지 않는다', () => {
    const { container } = render(
      <GolfStatChip chip={{ id: 'holes', label: 'HOLES', value: '18', tone: 'fg' }} />,
    );
    expect(container.querySelectorAll('[data-chip-suffix]')).toHaveLength(0);
  });
});
