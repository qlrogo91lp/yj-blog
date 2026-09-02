'use client';

import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNewPostStore } from '../_store';

export function DraftAction() {
  const status = useNewPostStore((s) => s.status);
  const saveStatus = useNewPostStore((s) => s.saveStatus);
  const submitPost = useNewPostStore((s) => s.submitPost);
  const isPublished = status === 'published';

  // 발행 글은 status를 유지한 채 저장한다 — "임시저장"이 발행 취소로 동작하지 않도록.
  const handleClick = async () => {
    const result = await submitPost(status);
    if (!result.success) toast.error(result.error);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={saveStatus === 'saving'}
    >
      <Save size={16} />
      {isPublished ? '저장' : '임시저장'}
    </Button>
  );
}
