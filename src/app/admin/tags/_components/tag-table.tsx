'use client';

import { DataTable } from '@/components/data-table';
import { tagColumns, type TagRow } from './columns';

type Props = {
  tags: TagRow[];
};

export function TagTable({ tags }: Props) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">태그 관리</h1>
      </div>

      <DataTable
        columns={tagColumns}
        data={tags}
        emptyMessage="태그가 없습니다."
      />
    </>
  );
}
