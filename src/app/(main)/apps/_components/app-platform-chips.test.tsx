import { render, screen } from '@testing-library/react';
import { AppPlatformChips } from './app-platform-chips';

describe('AppPlatformChips', () => {
  it('ios와 watch를 함께 주면 iPhone·Watch 칩을 렌더한다', () => {
    render(<AppPlatformChips platforms={['ios', 'watch']} />);
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('web을 주면 Web 칩만 렌더한다', () => {
    render(<AppPlatformChips platforms={['web']} />);
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.queryByText('iPhone')).not.toBeInTheDocument();
  });

  it('플랫폼 순서대로 렌더한다', () => {
    render(<AppPlatformChips platforms={['watch', 'ios']} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Watch');
    expect(items[1]).toHaveTextContent('iPhone');
  });
});
