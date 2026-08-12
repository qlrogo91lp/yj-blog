import { render, screen } from '@testing-library/react';
import { RalliSectionNavAction } from './ralli-section-nav.action';

describe('RalliSectionNavAction', () => {
  it('앵커 링크 3개를 렌더한다', () => {
    render(<RalliSectionNavAction />);
    expect(screen.getByRole('link', { name: 'Watch' })).toHaveAttribute('href', '#watch');
    expect(screen.getByRole('link', { name: 'Workout' })).toHaveAttribute('href', '#workout');
    expect(screen.getByRole('link', { name: 'iPhone' })).toHaveAttribute('href', '#iphone');
  });

  it('데스크톱 내비와 모바일 하단 바 양쪽에 App Store 링크를 둔다', () => {
    render(<RalliSectionNavAction />);
    const ctas = screen.getAllByRole('link', { name: /Ralli|App Store/i });
    for (const cta of ctas) {
      expect(cta).toHaveAttribute('href', 'https://apps.apple.com/us/app/ralli/id6449350578');
    }
  });

  it('내비에 접근성 레이블을 부여한다', () => {
    render(<RalliSectionNavAction />);
    expect(screen.getByRole('navigation', { name: 'Ralli 섹션' })).toBeInTheDocument();
  });
});
