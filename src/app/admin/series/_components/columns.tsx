'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { SeriesWithMeta } from '@/types';
import { SeriesActionsCell } from './series-actions-cell';

const columnHelper = createColumnHelper<SeriesWithMeta>();

export const seriesColumns = [
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
  columnHelper.accessor('postCount', {
    header: '글 수',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
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
    cell: (info) => <SeriesActionsCell series={info.row.original} />,
  }),
];
