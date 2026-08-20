'use client';

import type { LucideIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  icon: LucideIcon;
  tooltip: string;
  isActive?: boolean;
  onClick?: () => void;
};

export function ToolbarButton({
  icon: Icon,
  tooltip,
  isActive,
  onClick,
}: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={isActive ?? false}
          onPressedChange={() => onClick?.()}
          aria-label={tooltip}
          className="cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Icon size={16} />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
