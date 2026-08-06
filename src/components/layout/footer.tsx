import { SITE_NAME } from '@/lib/constants';
import { ContentContainer } from '@/components/layout/content-container';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <ContentContainer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </ContentContainer>
    </footer>
  );
}
