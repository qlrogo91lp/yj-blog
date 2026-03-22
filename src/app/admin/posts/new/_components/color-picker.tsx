'use client';

import type { Editor } from '@tiptap/react';
import { Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  editor: Editor | null;
};

const colors = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#cccccc',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#6366f1',
];

export function ColorPicker({ editor }: Props) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle size="sm" aria-label="텍스트 색상">
              <Palette className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>텍스트 색상</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-3" align="start">
        <p className="text-sm text-muted-foreground mb-2">텍스트 색상</p>
        <div className="grid grid-cols-5 gap-1">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => editor?.chain().focus().setColor(color).run()}
            />
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => editor?.chain().focus().unsetColor().run()}
        >
          색상 초기화
        </button>
      </PopoverContent>
    </Popover>
  );
}
