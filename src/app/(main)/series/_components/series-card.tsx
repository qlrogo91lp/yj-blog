import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { SeriesWithMeta } from '@/types';

type Props = {
  series: SeriesWithMeta;
};

export function SeriesCard({ series }: Props) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
    >
      {series.thumbnailUrl && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={series.thumbnailUrl}
            alt={series.name}
            fill
            sizes="(max-width: 640px) calc(100vw - 32px), 360px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold group-hover:underline">{series.name}</h2>
        {series.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {series.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {series.postCount}개의 글
          {series.lastPublishedAt &&
            ` · ${format(new Date(series.lastPublishedAt), 'yyyy년 M월 d일', { locale: ko })} 업데이트`}
        </p>
      </div>
    </Link>
  );
}
