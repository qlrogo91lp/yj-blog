'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Table as TableIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Toggle } from '@/components/ui/toggle'

type Props = {
  editor: Editor | null
}

export function TableInsertPopover({ editor }: Props) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const maxRows = 6
  const maxCols = 6

  const handleInsert = (r: number, c: number) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: r, cols: c, withHeaderRow: true })
      .run()
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle size="sm" aria-label="표">
              <TableIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom"><p>표</p></TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-3" align="start">
        <p className="text-sm text-muted-foreground mb-2">
          {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : '표 크기 선택'}
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
          {Array.from({ length: maxRows * maxCols }, (_, i) => {
            const r = Math.floor(i / maxCols) + 1
            const c = (i % maxCols) + 1
            const isHighlighted = r <= hoverRow && c <= hoverCol
            return (
              <button
                key={i}
                type="button"
                className={`w-6 h-6 border rounded-sm transition-colors ${
                  isHighlighted
                    ? 'bg-primary border-primary'
                    : 'bg-muted border-border'
                }`}
                onMouseEnter={() => { setHoverRow(r); setHoverCol(c) }}
                onMouseLeave={() => { setHoverRow(0); setHoverCol(0) }}
                onClick={() => handleInsert(r, c)}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
