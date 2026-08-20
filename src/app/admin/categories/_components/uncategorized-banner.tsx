import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  posts: { id: number; title: string }[];
};

export function UncategorizedBanner({ posts }: Props) {
  if (posts.length === 0) return null;

  const [first, ...rest] = posts;

  return (
    <div className="bg-muted mt-6 flex items-center gap-4 rounded-2xl px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">미분류 글 {posts.length}개</p>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">
          “{first.title || '(제목 없음)'}”
          {rest.length > 0 && ` 외 ${rest.length}개`} — 카테고리를 지정하면
          블로그 목록에서 필터링됩니다
        </p>
      </div>
      <Button className="rounded-full" asChild>
        <Link href={`/admin/posts/${first.id}/edit`}>지정하기</Link>
      </Button>
    </div>
  );
}
