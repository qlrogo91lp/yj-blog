import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

type Props = {
  drafts: { id: number; title: string; updatedAt: Date }[];
};

export function DraftQueueWidget({ drafts }: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">이어 쓸 글</h2>
        <span className="bg-status-draft text-foreground rounded-full px-2 text-xs">
          {drafts.length}
        </span>
      </div>

      {drafts.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          이어 쓸 글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/admin/posts/${draft.id}/edit`}
                className="block truncate text-sm font-medium hover:underline"
              >
                {draft.title || '(제목 없음)'}
              </Link>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatDistanceToNow(new Date(draft.updatedAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
