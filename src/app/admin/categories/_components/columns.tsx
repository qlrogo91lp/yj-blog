'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Category } from '@/types';
import { CategoryActionsCell } from './category-actions-cell';

const columnHelper = createColumnHelper<Category>();

export const categoryColumns = [
  columnHelper.accessor('name', {
    header: '이름',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('description', {
    header: '설명',
    cell: (info) => (
      <span className="max-w-48 truncate text-muted-foreground">
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: '생성일',
    cell: (info) => (
      <span className="text-muted-foreground">
        {format(new Date(info.getValue()), 'yyyy년 M월 d일', { locale: ko })}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '관리',
    cell: (info) => <CategoryActionsCell category={info.row.original} />,
  }),
];
