'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { editReferrerExcludes } from '../_services/edit-referrer-excludes';

type Props = {
  excludes: string[];
};

export function ReferrerExcludesFormAction({ excludes }: Props) {
  const [items, setItems] = useState(excludes);
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = (next: string[]) => {
    startTransition(async () => {
      const result = await editReferrerExcludes(next);
      if (result.success) {
        setItems(next);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  };

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed || items.includes(trimmed)) return;
    setValue('');
    save([...items, trimmed]);
  };

  const handleRemove = (target: string) => {
    save(items.filter((item) => item !== target));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            항상 제외할 유입 경로가 없습니다.
          </p>
        ) : (
          items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 pr-1">
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={isPending}
                aria-label={`${item} 제외 목록에서 삭제`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="예: t.co"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" onClick={handleAdd} disabled={isPending}>
          추가
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
