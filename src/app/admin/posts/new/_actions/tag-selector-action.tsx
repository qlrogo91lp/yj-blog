'use client';

import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { TagSummary } from '@/types';
import { useNewPostStore } from '../_store';
import { createTag } from '../_services/manage-tags';

type Props = {
  allTags: TagSummary[];
};

export function TagSelectorAction({ allTags: initialTags }: Props) {
  const tagIds = useNewPostStore((s) => s.tagIds);
  const setTagIds = useNewPostStore((s) => s.setTagIds);

  const [allTags, setAllTags] = useState<TagSummary[]>(initialTags);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));

  const filtered = input.trim()
    ? allTags.filter(
        (t) =>
          t.name.toLowerCase().includes(input.toLowerCase()) &&
          !tagIds.includes(t.id)
      )
    : allTags.filter((t) => !tagIds.includes(t.id));

  const addTag = useCallback(
    (tag: TagSummary) => {
      setTagIds([...tagIds, tag.id]);
      setInput('');
    },
    [tagIds, setTagIds]
  );

  const removeTag = useCallback(
    (id: number) => {
      setTagIds(tagIds.filter((tid) => tid !== id));
    },
    [tagIds, setTagIds]
  );

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      const exact = allTags.find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exact) {
        if (!tagIds.includes(exact.id)) addTag(exact);
        return;
      }

      const result = await createTag(trimmed);
      if (result.success) {
        if (!allTags.find((t) => t.id === result.tag.id)) {
          setAllTags((prev) => [...prev, result.tag]);
        }
        addTag(result.tag);
      } else {
        toast.error(result.error);
      }
    }

    if (e.key === 'Backspace' && !input && tagIds.length > 0) {
      removeTag(tagIds[tagIds.length - 1]);
    }
  };

  return (
    <div className="mb-4">
      <div
        className="flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
              }}
              className="rounded-full hover:bg-muted"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        <div className="relative flex-1 min-w-24">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={tagIds.length === 0 ? '태그 입력 후 Enter' : ''}
            className="border-0 p-0 h-6 shadow-none focus-visible:ring-0 bg-transparent"
          />
          {isOpen && (filtered.length > 0 || input.trim()) && (
            <div className="absolute left-0 top-8 z-50 w-48 rounded-md border bg-popover shadow-md">
              {filtered.slice(0, 8).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(tag);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {tag.name}
                </button>
              ))}
              {input.trim() &&
                !allTags.find(
                  (t) => t.name.toLowerCase() === input.trim().toLowerCase()
                ) && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground border-t">
                    Enter로 &quot;{input.trim()}&quot; 생성
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
