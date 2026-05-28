import { render, screen } from '@testing-library/react';
import { RalliCtaButton } from './ralli-cta-button';

describe('RalliCtaButton', () => {
  it('appStoreUrl이 있으면 App Store 다운로드 링크를 렌더한다', () => {
    render(<RalliCtaButton appStoreUrl="https://apps.apple.com/app/id123" />);
    const link = screen.getByRole('link', { name: /App Store/i });
    expect(link).toHaveAttribute('href', 'https://apps.apple.com/app/id123');
  });

  it('appStoreUrl이 비어있으면 Coming soon 배지를 렌더하고 링크는 없다', () => {
    render(<RalliCtaButton appStoreUrl="" />);
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
