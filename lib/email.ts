import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_TO = ['davidbaobaobao@gmail.com', 'info@yele.design']

// Domain yele.design must be verified in Resend dashboard → Domains for this to work.
const FROM = 'Yele Studio <info@yele.design>'

export async function sendNewMessageNotification({
  clientName,
  clientEmail,
  message,
  clientId,
}: {
  clientName: string
  clientEmail?: string
  message: string
  clientId: string
}) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'app.yele.design').replace(/^https?:\/\//, '')
  const threadUrl = `https://${appUrl}/admin/mensajes?client=${clientId}`

  await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    subject: `Nuevo mensaje de ${clientName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <p style="font-size:13px;color:#86868B;margin:0 0 24px;">Yele Studio · nuevo mensaje</p>
        <h2 style="font-size:20px;font-weight:600;color:#1D1D1F;margin:0 0 4px;">${clientName}</h2>
        ${clientEmail ? `<p style="font-size:13px;color:#86868B;margin:0 0 20px;">${clientEmail}</p>` : '<div style="margin-bottom:20px;"></div>'}
        <div style="background:#F5F5F7;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
          <p style="font-size:15px;color:#1D1D1F;margin:0;line-height:1.5;">${escapeHtml(message)}</p>
        </div>
        <a href="${threadUrl}" style="display:inline-block;background:#1D1D1F;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:500;">
          Ver conversación &rarr;
        </a>
      </div>
    `,
  })
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
