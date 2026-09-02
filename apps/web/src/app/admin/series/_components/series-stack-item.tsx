import Link from 'next/link';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AdminSeriesItem } from '@/types';
import { SeriesActionsCell } from './series-actions-cell';

type Props = {
  series: AdminSeriesItem;
  isExpanded: boolean;
  onToggle: () => void;
};

export function SeriesStackItem({ series, isExpanded, onToggle }: Props) {
  const isCompleted = series.status === 'completed';

  return (
    <div className="rounded-2xl border">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{series.name}</span>
              <Badge variant={isCompleted ? 'secondary' : 'default'}>
                {isCompleted ? '완결' : '연재 중'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {series.description
                ? `${series.description} · ${series.posts.length}편`
                : `${series.posts.length}편`}
            </p>
          </div>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <SeriesActionsCell series={series} />
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-3">
          <ol className="flex flex-col gap-1">
            {series.posts.map((post, index) => {
              const isDraft = post.status === 'draft';
              return (
                <li key={post.id} className="flex items-center gap-3 py-1.5">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                      isDraft
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm hover:underline',
                      isDraft && 'text-muted-foreground'
                    )}
                  >
                    {post.title || '(제목 없음)'}
                  </Link>
                  {isDraft ? (
                    <Badge className="bg-status-draft text-foreground">
                      임시저장
                    </Badge>
                  ) : (
                    post.publishedAt && (
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(post.publishedAt), 'M월 d일', {
                          locale: ko,
                        })}
                      </span>
                    )
                  )}
                </li>
              );
            })}
          </ol>

          <Link
            href="/admin/posts/new"
            className="text-muted-foreground hover:text-foreground mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed py-2 text-sm transition-colors"
          >
            <Plus size={14} />이 시리즈에 글 추가
          </Link>
        </div>
      )}
    </div>
  );
}
