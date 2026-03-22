'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewDialog } from './_preview';

export function PreviewButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Eye className="h-4 w-4 mr-1" />
        미리보기
      </Button>
      <PreviewDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
