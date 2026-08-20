'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { PostWithCategory } from '@/types';
import { PostActionsCellAction } from '../_actions/post-actions-cell.action';

const columnHelper = createColumnHelper<PostWithCategory>();

export const postColumns = [
  columnHelper.accessor('title', {
    header: '제목',
    cell: (info) => {
      const { id, slug, status } = info.row.original;
      const title = info.getValue();
      const href = status === 'draft' ? `/admin/posts/${id}/edit` : `/posts/${slug}`;
      return (
        <Link
          href={href}
          className={
            title
              ? 'font-medium hover:underline'
              : 'italic text-muted-foreground hover:underline'
          }
        >
          {title || '(제목 없음)'}
        </Link>
      );
    },
  }),
  columnHelper.accessor((row) => row.category?.name, {
    id: 'category',
    header: '카테고리',
    cell: (info) => (
      <span className="text-muted-foreground">
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  columnHelper.accessor('updatedAt', {
    header: '수정일',
    cell: (info) => (
      <span className="text-muted-foreground">
        {format(new Date(info.getValue()), 'yyyy년 M월 d일', { locale: ko })}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    header: '상태',
    cell: (info) => (
      <Badge variant={info.getValue() === 'published' ? 'default' : 'secondary'}>
        {info.getValue() === 'published' ? '발행' : '임시저장'}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '관리',
    cell: (info) => (
      <PostActionsCellAction postId={info.row.original.id} postTitle={info.row.original.title} />
    ),
  }),
];
