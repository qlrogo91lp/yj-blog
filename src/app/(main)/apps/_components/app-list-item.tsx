import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AppPlatformChips } from './app-platform-chips';
import type { App } from '../_utils/apps-data';

type Props = {
  app: App;
};

export function AppListItem({ app }: Props) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50"
    >
      <Image
        src={app.iconSrc}
        alt={`${app.name} 앱 아이콘`}
        width={56}
        height={56}
        sizes="56px"
        className="size-14 flex-none rounded-xl"
      />

      <div className="min-w-0 flex-1">
        <AppPlatformChips platforms={app.platforms} />
        <h2 className="mt-1.5 font-semibold">{app.name}</h2>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{app.description}</p>
      </div>

      <ChevronRight
        size={18}
        className="flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
