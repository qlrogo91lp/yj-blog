'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNewPostStore } from '../_store';
import { CharacterCounter } from '../_components/character-counter';
import { generateExcerpt } from '../_services/generate-excerpt';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function SeoSectionAction() {
  const [open, setOpen] = useState(false);
  const excerpt = useNewPostStore((s) => s.excerpt);
  const setExcerpt = useNewPostStore((s) => s.setExcerpt);
  const metaTitle = useNewPostStore((s) => s.metaTitle);
  const setMetaTitle = useNewPostStore((s) => s.setMetaTitle);
  const content = useNewPostStore((s) => s.content);
  const isGenerating = useNewPostStore((s) => s.isGeneratingExcerpt);
  const setIsGenerating = useNewPostStore((s) => s.setIsGeneratingExcerpt);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const { excerpt: generated } = await generateExcerpt(content);
      setExcerpt(generated);
      toast.success('AI 요약을 생성했습니다');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'AI 요약 생성에 실패했습니다',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="mt-6 rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 cursor-pointer"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        SEO 설정
      </button>
      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="seo-excerpt">요약 (excerpt)</Label>
              <CharacterCounter value={excerpt} recommendedMax={200} hardMax={500} />
            </div>
            <Textarea
              id="seo-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="글 목록과 검색 결과 설명에 쓰입니다. AI 버튼으로 초안을 생성한 뒤 다듬으세요."
              rows={3}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={isGenerating || content.length === 0}
              onClick={handleGenerate}
            >
              <Sparkles size={16} />
              {isGenerating ? '생성 중…' : 'AI로 요약 생성'}
            </Button>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="seo-meta-title">SEO 제목 (meta title)</Label>
              <CharacterCounter value={metaTitle} recommendedMax={60} hardMax={100} />
            </div>
            <Input
              id="seo-meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="비우면 글 제목이 그대로 사용됩니다 (50–60자 권장)"
            />
          </div>
        </div>
      )}
    </section>
  );
}
