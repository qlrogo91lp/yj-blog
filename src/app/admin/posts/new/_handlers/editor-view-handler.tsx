'use client';

import { MarkdownEditorAction } from '../_actions/markdown-editor-action';
import { WysiwygEditorAction } from '../_actions/wysiwyg-editor-action';
import { useNewPostStore } from '../_store';

export function EditorViewHandler() {
	const mode = useNewPostStore((s) => s.mode);

	return (
		<>
			{mode === 'wysiwyg' ? (
				<WysiwygEditorAction />
			) : (
				<MarkdownEditorAction />
			)}
		</>
	);
}