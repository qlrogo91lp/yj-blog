import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '플레이그라운드 | YJLOGs',
  description: '프론트엔드 기술 위키 & 인터랙티브 데모',
};

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">플레이그라운드</h1>
      <p className="mt-2 text-muted-foreground">
        프론트엔드 기술 위키와 인터랙티브 데모를 모아둔 공간입니다.
      </p>
      <div className="mt-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
        <p className="text-sm">카테고리 구성 중입니다. 곧 업데이트될 예정입니다.</p>
      </div>
    </div>
  );
}
