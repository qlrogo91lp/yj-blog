import { submitPost } from './submit-post-action'

export async function publishPost() {
  return await submitPost('published')
}
