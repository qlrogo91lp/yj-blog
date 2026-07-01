'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewDialogAction } from './_preview/preview.action';

export function PreviewButtonAction() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Eye className="h-4 w-4 mr-1" />
        미리보기
      </Button>
      <PreviewDialogAction open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
