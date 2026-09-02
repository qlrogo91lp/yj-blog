'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArticleContainer } from '@/components/layout/article-container';
import { useNewPostStore } from '../../_store';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialogAction({ open, onOpenChange }: Props) {
  const title = useNewPostStore((s) => s.title);
  const content = useNewPostStore((s) => s.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>미리보기</DialogTitle>
          <DialogDescription className="sr-only">작성 중인 글의 미리보기입니다</DialogDescription>
        </DialogHeader>
        <ArticleContainer className="mt-4">
          <article>
            <h1 className="text-3xl font-bold mb-6">{title || '제목 없음'}</h1>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        </ArticleContainer>
      </DialogContent>
    </Dialog>
  );
}
