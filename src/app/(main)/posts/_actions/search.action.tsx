'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

export function SearchAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') ?? '');

  function applySearch(query: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    router.push(`/posts?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applySearch(value.trim());
  }

  function handleClear() {
    setValue('');
    applySearch('');
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        type="text"
        placeholder="글 제목 또는 내용 검색"
        className="max-[500px]:w-full rounded-full border bg-muted px-4 py-2 pl-10 pr-8 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
      />
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="검색어 지우기"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
