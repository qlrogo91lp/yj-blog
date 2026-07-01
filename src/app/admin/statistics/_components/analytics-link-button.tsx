import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GA_DASHBOARD_URL = 'https://analytics.google.com/';

export function AnalyticsLinkButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={GA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} />
        Google Analytics에서 보기
      </Link>
    </Button>
  );
}
