'use client';

import { useEffect } from 'react';
import { useNewPostStore } from '../_store';

/**
 * 신규 글 페이지를 떠날 때 스토어를 비운다.
 * 발행 후 다시 "글쓰기"로 들어왔을 때 이전 글의 postId·내용이 남아
 * 발행 글을 덮어쓰거나 자동저장이 draft로 되돌리는 문제를 막는다.
 * 마운트 시에는 reset하지 않는다(에디터 초기 content와 어긋남).
 */
export function NewPostResetHandler() {
  useEffect(() => {
    return () => {
      useNewPostStore.getState().reset();
    };
  }, []);

  return null;
}
