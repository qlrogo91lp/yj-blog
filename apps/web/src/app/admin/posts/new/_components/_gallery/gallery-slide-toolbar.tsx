'use client';

import { ArrowLeft, ArrowRight, Settings, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
  index: number;
  total: number;
  caption: string;
  alt: string;
  onMove: (to: number) => void;
  onCaptionChange: (caption: string) => void;
  onAltChange: (alt: string) => void;
  onDelete: () => void;
};

export function GallerySlideToolbar({
  index,
  total,
  caption,
  alt,
  onMove,
  onCaptionChange,
  onAltChange,
  onDelete,
}: Props) {
  return (
    <div
      className="flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-md"
      role="toolbar"
    >
      <button
        type="button"
        aria-label="왼쪽으로 이동"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        type="button"
        aria-label="오른쪽으로 이동"
        disabled={index === total - 1}
        onClick={() => onMove(index + 1)}
        className="rounded p-1.5 hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
      >
        <ArrowRight size={16} />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="캡션과 대체 텍스트 설정"
            className="rounded p-1.5 hover:bg-accent cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="w-72">
          <Label
            htmlFor={`gallery-caption-${index}`}
            className="mb-1 block text-xs"
          >
            캡션
          </Label>
          <Input
            id={`gallery-caption-${index}`}
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="사진 아래에 붙는 설명"
          />
          <Label
            htmlFor={`gallery-alt-${index}`}
            className="mt-3 mb-1 block text-xs"
          >
            대체 텍스트 (alt)
          </Label>
          <Input
            id={`gallery-alt-${index}`}
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="이미지를 설명하는 짧은 문장"
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        aria-label="슬라이드 삭제"
        onClick={onDelete}
        className="rounded p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
