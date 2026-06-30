'use client';

import { AlignCenter, AlignLeft, AlignRight, ChevronsLeftRight, LucideIcon, Settings, Trash2 } from 'lucide-react';
import type { ImageAlign, ImageSize } from '../../_utils/image-extension';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  size: ImageSize;
  align: ImageAlign;
  alt: string;
  onSizeChange: (size: ImageSize) => void;
  onAlignChange: (align: ImageAlign) => void;
  onAltChange: (alt: string) => void;
  onDelete: () => void;
};

// prose.css 에 figure 참조
const sizeOptions: { value: ImageSize; label: string, icon?: LucideIcon }[] = [
  { value: 'small', label: '40%' },
  { value: 'medium', label: '70%' },
  { value: 'full', label: '100%', icon: ChevronsLeftRight },
];

const alignOptions: {
  value: ImageAlign;
  label: string;
  icon: LucideIcon;
}[] = [
    { value: 'left', label: '왼쪽 정렬', icon: AlignLeft },
    { value: 'center', label: '가운데 정렬', icon: AlignCenter },
    { value: 'right', label: '오른쪽 정렬', icon: AlignRight },
  ];

export function ImageToolbar({
  size,
  align,
  alt,
  onSizeChange,
  onAlignChange,
  onAltChange,
  onDelete,
}: Props) {
  const alignDisabled = size === 'full';

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-md"
      role="toolbar"
    >
      {alignOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={align === value}
          disabled={alignDisabled}
          onClick={() => onAlignChange(value)}
          className={cn(
            'rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer',
            align === value && !alignDisabled && 'bg-primary text-primary-foreground hover:bg-muted-foreground',
            alignDisabled && 'cursor-not-allowed',
          )}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      {sizeOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={size === value}
          onClick={() => onSizeChange(value)}
          className={cn(
            'rounded px-2 py-1 text-xs hover:bg-accent cursor-pointer',
            size === value && 'bg-primary text-primary-foreground hover:bg-muted-foreground'
          )}
        >
          {Icon ? <Icon size={16} /> : label}
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="대체 텍스트 설정"
            className="rounded p-1.5 hover:bg-accent cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="w-72">
          <Label htmlFor="image-alt-input" className="mb-1 block text-xs">
            대체 텍스트 (alt)
          </Label>
          <Input
            id="image-alt-input"
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="이미지를 설명하는 짧은 문장"
          />
        </PopoverContent>
      </Popover>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        aria-label="이미지 삭제"
        onClick={onDelete}
        className="rounded p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
