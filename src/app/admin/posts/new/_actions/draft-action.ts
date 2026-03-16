import { submitPost } from './submit-post-action'

export async function draftPost() {
  await submitPost('draft')
}
