import { render, screen } from '@testing-library/react';
import { RalliMarquee } from './ralli-marquee';

describe('RalliMarquee', () => {
  it('끊김 없는 루프를 위해 항목을 두 벌 렌더한다', () => {
    render(<RalliMarquee items={['DEUCE', 'NO ADS']} />);
    expect(screen.getAllByText('DEUCE')).toHaveLength(2);
    expect(screen.getAllByText('NO ADS')).toHaveLength(2);
  });

  it('보조 정보이므로 스크린 리더에서 숨긴다', () => {
    const { container } = render(<RalliMarquee items={['DEUCE']} />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
