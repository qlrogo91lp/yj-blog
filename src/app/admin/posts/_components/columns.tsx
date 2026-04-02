'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { PostWithCategory } from '@/types';
import { PostActionsCell } from './post-actions-cell';

const columnHelper = createColumnHelper<PostWithCategory>();

export const postColumns = [
  columnHelper.accessor('title', {
    header: '제목',
    cell: (info) => (
      <Link
        href={`/posts/${info.row.original.slug}`}
        className="font-medium hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
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
      <PostActionsCell postId={info.row.original.id} postTitle={info.row.original.title} />
    ),
  }),
];
