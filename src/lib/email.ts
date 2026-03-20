import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com'
const fromEmail = `noreply@${new URL(siteUrl).hostname}`

export async function sendReplyNotification({
  to,
  postTitle,
  postSlug,
  authorName,
  replyContent,
}: {
  to: string
  postTitle: string
  postSlug: string
  authorName: string
  replyContent: string
}) {
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `[블로그] "${postTitle}" 글에 답글이 달렸습니다`,
    html: `
      <p><strong>${authorName}</strong>님이 답글을 남겼습니다:</p>
      <blockquote>${replyContent}</blockquote>
      <a href="${siteUrl}/posts/${postSlug}">글 보러가기</a>
    `,
  })
}
