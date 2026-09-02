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
	const saveStatus = useNewPostStore((s) => s.saveStatus);
	const submitPost = useNewPostStore((s) => s.submitPost);

	// 마지막 편집(changeCount) 기준 30초 뒤 저장. dirty가 아니거나 필수값이 없거나
	// 이미 다른 저장(수동 저장/발행 포함)이 진행 중이면 걸지 않는다 — 자동저장이
	// 수동 저장과 겹쳐 서버로 동시에 나가는 것을 막는다(스토어 submitPost의 in-flight
	// 가드가 최종 방어선이지만, 여기서도 불필요한 타이머를 걸지 않는다).
	// saveStatus를 의존성에 포함해 두면, 진행 중이던 저장이 끝나(saving → saved/error)
	// 여전히 dirty인 상태로 남아 있을 때 타이머가 자동으로 다시 걸린다(실패한 자동저장 재시도 포함).
	useEffect(() => {
		if (!isDirty || !hasRequiredFields || saveStatus === 'saving') return;

		const timer = setTimeout(() => {
			submitPost(status);
		}, intervalMs);

		return () => clearTimeout(timer);
	}, [changeCount, isDirty, hasRequiredFields, status, saveStatus, submitPost]);

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
