import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_TO = ['davidbaobaobao@gmail.com', 'info@yele.design']

// Domain yele.design must be verified in Resend dashboard → Domains for this to work.
const FROM = 'Yele Studio <info@yele.design>'

// Websafe stacks only — mail clients cannot load web fonts, so Archivo is a
// progressive enhancement and Helvetica/Arial is what most recipients will see.
const HEADING_FONT = "Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif"
const BODY_FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"

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
    subject: `New message from ${clientName}`,
    html: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;padding:0;background:#F7F6F3;">
  <tr>
    <td align="center" style="padding:32px 16px;background:#F7F6F3;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#FFFFFF;border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">

            <p style="margin:0 0 20px;font-family:${BODY_FONT};font-size:12px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:#8A8A92;">
              Yele Studio <span style="color:#D46FC8;">&middot;</span> New message
            </p>

            <h1 style="margin:0 0 4px;font-family:${HEADING_FONT};font-size:22px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:#16161A;">
              ${escapeHtml(clientName)}
            </h1>

            ${
              clientEmail
                ? `<p style="margin:0 0 22px;font-family:${BODY_FONT};font-size:13px;line-height:1.5;color:#8A8A92;">${escapeHtml(clientEmail)}</p>`
                : `<p style="margin:0 0 22px;font-size:1px;line-height:1px;">&nbsp;</p>`
            }

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#F2F0EB;border-radius:12px;">
              <tr>
                <td style="padding:16px 20px;font-family:${BODY_FONT};font-size:15px;line-height:1.55;color:#16161A;">
                  ${escapeHtml(message).replace(/\n/g, '<br>')}
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
              <tr>
                <td align="center" style="background:#1A1A1F;border-radius:9999px;">
                  <a href="${threadUrl}" style="display:inline-block;padding:13px 26px;font-family:${BODY_FONT};font-size:14px;line-height:1;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9999px;">
                    View conversation &rarr;
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td align="center" style="padding:18px 28px 0;font-family:${BODY_FONT};font-size:11px;line-height:1.5;color:#8A8A92;">
            Yele Studio <span style="color:#D46FC8;">&middot;</span> app.yele.design
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
    `,
  })
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
