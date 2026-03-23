import Link from 'next/link';
import { ExternalLink, Globe, Smartphone } from 'lucide-react';
import type { App } from '../_utils/apps-data';

type Props = {
  app: App;
};

export function AppCard({ app }: Props) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex flex-col gap-3 rounded-lg border p-5 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {app.type === 'web' ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {app.type === 'web' ? '웹앱' : '앱스토어'}
          </span>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div>
        <h2 className="font-semibold text-lg">{app.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{app.description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {app.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
