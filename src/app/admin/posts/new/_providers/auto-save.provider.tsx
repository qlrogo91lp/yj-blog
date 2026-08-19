'use client';

import { useEffect } from 'react';
import { selectIsDirty, useNewPostStore } from '../_store';

const intervalMs = 30000;

export function AutoSaveProvider() {
	const isDirty = useNewPostStore(selectIsDirty);
	const changeCount = useNewPostStore((s) => s.changeCount);
	const hasRequiredFields = useNewPostStore(
		(s) => s.title.trim().length > 0 && s.content.length > 0,
	);
	const status = useNewPostStore((s) => s.status);
	const submitPost = useNewPostStore((s) => s.submitPost);

	// 마지막 편집(changeCount) 기준 30초 뒤 저장. dirty가 아니거나 필수값이 없으면 걸지 않는다.
	useEffect(() => {
		if (!isDirty || !hasRequiredFields) return;

		const timer = setTimeout(() => {
			submitPost(status);
		}, intervalMs);

		return () => clearTimeout(timer);
	}, [changeCount, isDirty, hasRequiredFields, status, submitPost]);

	// 미저장 상태로 탭을 닫거나 새로고침하면 브라우저 경고를 띄운다.
	// (Next.js 클라이언트 라우팅 이동은 잡지 못한다.)
	useEffect(() => {
		if (!isDirty) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [isDirty]);

	return null;
}
