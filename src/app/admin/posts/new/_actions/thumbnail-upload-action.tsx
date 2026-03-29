'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '../_components/_image-upload/_services/upload-image';
import { useNewPostStore } from '../_store';

export function ThumbnailUploadAction() {
  const { thumbnailUrl, setThumbnailUrl } = useNewPostStore(
    useShallow((state) => ({
      thumbnailUrl: state.thumbnailUrl,
      setThumbnailUrl: state.setThumbnailUrl,
    }))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData);
      if (result.url) setThumbnailUrl(result.url);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {thumbnailUrl ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
          <Image src={thumbnailUrl} alt="썸네일" fill className="object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => setThumbnailUrl(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {isUploading ? '업로드 중...' : '썸네일 추가'}
        </Button>
      )}
    </div>
  );
}
