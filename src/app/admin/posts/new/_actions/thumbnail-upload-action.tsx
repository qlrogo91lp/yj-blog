'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadImage } from '../_components/_image-upload/_services/upload-image';
import { useNewPostStore } from '../_store';

const THUMBNAIL_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB

export function ThumbnailUploadAction() {
  const { postId, thumbnailUrl, setPostId, setThumbnailUrl } = useNewPostStore(
    useShallow((state) => ({
      postId: state.postId,
      thumbnailUrl: state.thumbnailUrl,
      setPostId: state.setPostId,
      setThumbnailUrl: state.setThumbnailUrl,
    }))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > THUMBNAIL_SIZE_LIMIT) {
      toast.error('썸네일은 1MB 이하만 업로드 가능합니다');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadImage(formData, postId, 'thumbnail');
      if (result.url) {
        setThumbnailUrl(result.url);
        if (result.postId && !postId) {
          setPostId(result.postId);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      e.target.value = '';
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
            <X size={16} />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-30"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={16} />
          {isUploading ? '업로드 중...' : '썸네일 추가'}
        </Button>
      )}
    </div>
  );
}
