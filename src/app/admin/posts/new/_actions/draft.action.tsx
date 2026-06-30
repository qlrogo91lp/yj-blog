'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitPost } from '../_services/submit-post';
import { useNewPostStore } from '../_store';

export function DraftAction() {
  const saveStatus = useNewPostStore((s) => s.saveStatus);

  const handleClick = async () => {
    await submitPost('draft');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={saveStatus === 'saving'}
    >
      <Save className="h-4 w-4 mr-1" />
      임시저장
    </Button>
  );
}
