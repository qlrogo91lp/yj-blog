'use client';

import Link from 'next/link';
import {
  ClerkLoading,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

/**
 * 로그인 상태에서만 노출되는 관리자 대시보드 진입 버튼.
 *
 * 이 파일이 'use client'인 이유: @clerk/nextjs의 SignedIn/SignedOut을 서버
 * 컴포넌트에서 렌더하면 내부적으로 auth()가 호출되어 Header를 포함한 (main)
 * 그룹 전체가 동적 렌더링으로 강제된다. 클라이언트 경계에서 import하면
 * 클라이언트 버전이 선택되어 공개 라우트의 정적 렌더링이 유지된다.
 */
export function HeaderAdminLink() {
  return (
    <SignedIn>
      <Link href="/admin" className="mr-1">
        <Button variant="default" size="sm">
          대시보드
        </Button>
      </Link>
    </SignedIn>
  );
}

/**
 * 비로그인 시 로그인 버튼, 로그인 시 UserButton.
 * 둘 중 하나는 반드시 렌더되므로 Clerk 로딩 중에는 동일 크기의
 * 플레이스홀더로 자리를 예약해 레이아웃 시프트를 막는다.
 */
export function HeaderAuthButtons() {
  return (
    <>
      <ClerkLoading>
        <div className="h-8 w-8 rounded-full bg-muted" aria-hidden />
      </ClerkLoading>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
