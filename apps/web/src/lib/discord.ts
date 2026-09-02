const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yjlogs.com';

export async function sendCommentNotification({
  postTitle,
  postSlug,
  authorName,
  content,
  isReply,
}: {
  postTitle: string;
  postSlug: string;
  authorName: string;
  content: string;
  isReply: boolean;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const label = isReply ? '대댓글' : '댓글';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `💬 "${postTitle}"에 ${label}이 달렸습니다`,
          description: content,
          fields: [{ name: '작성자', value: authorName, inline: true }],
          url: `${siteUrl}/posts/${postSlug}`,
        },
      ],
    }),
  });
}
