'use client';

import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react';
import type { ImageAlign, ImageSize } from './image-extension';

type Props = {
  size: ImageSize;
  align: ImageAlign;
  onSizeChange: (size: ImageSize) => void;
  onAlignChange: (align: ImageAlign) => void;
  onDelete: () => void;
};

const sizeOptions: { value: ImageSize; label: string }[] = [
  { value: 'small', label: '작게' },
  { value: 'medium', label: '중간' },
  { value: 'full', label: '글 너비' },
];

const alignOptions: {
  value: ImageAlign;
  label: string;
  icon: typeof AlignLeft;
}[] = [
  { value: 'left', label: '왼쪽 정렬', icon: AlignLeft },
  { value: 'center', label: '가운데 정렬', icon: AlignCenter },
  { value: 'right', label: '오른쪽 정렬', icon: AlignRight },
];

export function ImageToolbar({
  size,
  align,
  onSizeChange,
  onAlignChange,
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
          className={`rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent ${
            align === value && !alignDisabled
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      {sizeOptions.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={size === value}
          onClick={() => onSizeChange(value)}
          className={`rounded px-2 py-1 text-xs hover:bg-accent ${
            size === value ? 'bg-primary text-primary-foreground' : ''
          }`}
        >
          {label}
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        aria-label="이미지 삭제"
        onClick={onDelete}
        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
