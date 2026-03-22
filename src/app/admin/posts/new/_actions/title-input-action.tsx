'use client';

import { useNewPostStore } from '../_store';

export function TitleInputAction() {
  const title = useNewPostStore((s) => s.title);
  const setTitle = useNewPostStore((s) => s.setTitle);

  return (
    <input
      type="text"
      placeholder="제목을 입력하세요"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder:text-muted-foreground/50"
    />
  );
}
