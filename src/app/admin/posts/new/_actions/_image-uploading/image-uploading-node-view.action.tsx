'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function ImageUploadingNodeViewAction({ node }: NodeViewProps) {
  const previewUrl = (node.attrs.previewUrl as string) ?? '';

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <NodeViewWrapper as="figure" className="relative my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="업로드 미리보기" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">업로드 중...</span>
      </div>
    </NodeViewWrapper>
  );
}
