'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TagActionsCell } from './tag-actions-cell';

type TagRow = {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  postCount: number;
};

const columnHelper = createColumnHelper<TagRow>();

export type { TagRow };

export const tagColumns = [
  columnHelper.accessor('name', {
    header: '이름',
    cell: (info) => (
      <span className="font-medium">#{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('postCount', {
    header: '글 수',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}개</span>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: '생성일',
    cell: (info) => (
      <span className="text-muted-foreground">
        {format(info.getValue(), 'yyyy년 M월 d일', { locale: ko })}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '관리',
    cell: (info) => <TagActionsCell tag={info.row.original} />,
  }),
];
