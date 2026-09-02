import Link from 'next/link';

type Item = {
  id: string;
  label: string;
  value: number;
  href?: string;
};

type Props = {
  title: string;
  items: Item[];
  moreHref: string;
  /** 'rank'는 순위 숫자 + 값, 'percent'는 퍼센트 바 */
  variant?: 'rank' | 'percent';
};

export function DashboardRankList({
  title,
  items,
  moreHref,
  variant = 'rank',
}: Props) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={moreHref}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          더보기
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          아직 데이터가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, index) => (
            <li key={item.id}>
              {variant === 'rank' ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-4 shrink-0 text-xs">
                    {index + 1}
                  </span>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="min-w-0 flex-1 truncate hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                  )}
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="min-w-0 truncate">{item.label}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {item.value}%
                    </span>
                  </div>
                  <div
                    data-slot="rank-bar"
                    className="bg-muted h-1.5 rounded-full"
                  >
                    <div
                      className="bg-foreground h-full rounded-full"
                      style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
