import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, Smartphone } from 'lucide-react';
import { apps, getApp } from '../_utils/apps-data';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) return {};

  return {
    title: `${app.name} | YJ Blog`,
    description: app.description,
  };
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const app = getApp(slug);

  if (!app) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/apps"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Apps 목록
      </Link>

      <div className="mt-6">
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

        <h1 className="mt-2 text-3xl font-bold">{app.name}</h1>
        <p className="mt-2 text-muted-foreground">{app.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {app.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-muted-foreground leading-relaxed">{app.longDescription}</p>
      </div>

      {app.links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {app.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {link.label}
            </a>
          ))}
        </div>
      )}

      {app.links.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">출시 준비 중입니다.</p>
      )}
    </div>
  );
}
