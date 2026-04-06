'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import { Search } from 'lucide-react';

export function SearchAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    router.push(`/posts?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        defaultValue={searchParams.get('search') ?? ''}
        type="text"
        placeholder="글 제목 또는 내용 검색"
        className="w-full rounded-full border bg-muted px-4 py-2 pl-10 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
      />
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </form>
  );
}
