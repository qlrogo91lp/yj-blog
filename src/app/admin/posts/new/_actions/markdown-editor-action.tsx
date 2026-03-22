'use client';

import { Textarea } from '@/components/ui/textarea';
import { useNewPostStore } from '../_store';

export function MarkdownEditorAction() {
  const content = useNewPostStore((s) => s.content);
  const setContent = useNewPostStore((s) => s.setContent);
  const setContentFormat = useNewPostStore((s) => s.setContentFormat);

  return (
    <Textarea
      placeholder="마크다운으로 작성하세요..."
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        setContentFormat('markdown');
      }}
      className="min-h-[500px] resize-none font-mono text-sm border-none shadow-none focus-visible:ring-0"
    />
  );
}
