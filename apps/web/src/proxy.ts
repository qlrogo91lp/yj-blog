import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

/**
 * Clerk를 인증이 실제로 필요한 경로에만 적용한다.
 *
 * 공개 라우트(`/`, `/posts/*`, `/tags` 등)는 `auth()`를 호출하지 않고,
 * 공개 Server Action(addComment·removeComment)도 bcrypt 비밀번호 방식이라
 * Clerk와 무관하다. 전역 적용 시 CDN 캐시가 HIT여도 요청당 ~85ms가 붙는다.
 *
 * `/api/track`만 포함하는 이유: 관리자 본인의 방문을 집계에서 제외하기 위해
 * `auth()`를 사용하는 곳이 `api/track`뿐이기 때문이다. 그 외 `/api/*`
 * (예: `api/posts`, `api/posts/tags`)는 인증이 필요 없는 공개 읽기 엔드포인트라
 * 의도적으로 matcher에서 제외한다.
 */
export const config = {
  matcher: ['/admin/:path*', '/api/track'],
};
