'use client';

import { useEffect, useRef } from 'react';
import { useNewPostStore } from '../_store';
import { submitPost } from '../_services/submit-post';

const intervalMs = 30000;

export function AutoSaveProvider() {
	const title = useNewPostStore((s) => s.title);
	const content = useNewPostStore((s) => s.content);
	const status = useNewPostStore((s) => s.status);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!title && !content) return;

		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			submitPost(status);
		}, intervalMs);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [title, content, status]);

	return null;
}