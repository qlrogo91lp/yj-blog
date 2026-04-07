import Link from 'next/link';
import { FolderOpen, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">빠른 작업</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/admin/posts/new">
            <PenLine size={14} />
            새 글 작성
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/categories">
            <FolderOpen size={14} />
            카테고리 관리
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
