'use client';

import { useState, useRef, MouseEvent, PointerEvent } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut } from 'lucide-react';

const minScale = 1;
const maxScale = 4;
const scaleStep = 0.5;

type Props = { html: string };
type ZoomedImage = { src: string; alt: string };

export function PostContent({ html }: Props) {
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // drag.current.active은 ref로 관리해 stale closure 없이 동기적으로 읽는다
  const drag = useRef({ active: false, lastX: 0, lastY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const clampPosition = (pos: { x: number; y: number }, s: number) => {
    const el = containerRef.current;
    if (!el || s <= minScale) return { x: 0, y: 0 };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, pos.x)),
      y: Math.min(maxY, Math.max(-maxY, pos.y)),
    };
  };

  const resetDialog = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    drag.current.active = false;
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'IMG') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const img = target as HTMLImageElement;
    resetDialog();
    setZoomed({ src: img.src, alt: img.alt });
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (scale <= minScale) return;
    // pointer capture로 컨테이너 밖으로 빠르게 이동해도 이벤트를 계속 수신
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current.active = true;
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    // dx/dy를 setPosition 호출 전에 캡처해 ref 변이 타이밍 문제를 방지
    const dx = e.clientX - drag.current.lastX;
    const dy = e.clientY - drag.current.lastY;
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
    setPosition((p) => clampPosition({ x: p.x + dx, y: p.y + dy }, scale));
  };

  const stopDrag = () => {
    drag.current.active = false;
    setIsDragging(false);
  };

  const changeScale = (next: number) => {
    if (next <= minScale) {
      setScale(minScale);
      setPosition({ x: 0, y: 0 });
      return;
    }
    // 현재 보이는 영역 중심을 기준으로 재앵커
    const reanchored = { x: position.x * next / scale, y: position.y * next / scale };
    setScale(next);
    setPosition(clampPosition(reanchored, next));
  };

  return (
    <>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert [&_img]:cursor-zoom-in"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <Dialog
        open={zoomed !== null}
        onOpenChange={(open) => {
          if (!open) {
            setZoomed(null);
            resetDialog();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] border-0 bg-transparent p-0 shadow-none sm:max-w-[90vw]"
        >
          <DialogTitle className="sr-only">이미지 확대 보기</DialogTitle>
          <DialogDescription className="sr-only">{zoomed?.alt ?? '이미지'}</DialogDescription>
          {zoomed && (
            <div className="flex flex-col items-center gap-3">
              <div
                ref={containerRef}
                className="max-h-[80vh] overflow-hidden"
                style={{ cursor: scale > minScale ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomed.src}
                  alt={zoomed.alt}
                  className="max-h-[80vh] w-auto rounded-lg object-contain"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.2s',
                  }}
                  draggable={false}
                />
              </div>
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
                <button
                  onClick={() => changeScale(Math.max(minScale, scale - scaleStep))}
                  disabled={scale <= minScale}
                  className="text-white disabled:opacity-30"
                  aria-label="축소"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="w-10 text-center text-sm text-white">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => changeScale(Math.min(maxScale, scale + scaleStep))}
                  disabled={scale >= maxScale}
                  className="text-white disabled:opacity-30"
                  aria-label="확대"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
