import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_TO = ['info@yele.design', 'davidbaobaobao@gmail.com']

function row(label: string, value: string) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:5px 0;font-size:12px;color:#8A8A92;width:150px;vertical-align:top;font-family:sans-serif;">${label}</td>
      <td style="padding:5px 0;font-size:13px;color:#16161A;vertical-align:top;font-family:sans-serif;">${value.replace(/\n/g, '<br>')}</td>
    </tr>`
}

function section(title: string, rows: string) {
  if (!rows.trim()) return ''
  return `
    <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8A8A92;margin:24px 0 8px;padding-bottom:6px;border-bottom:1px solid #EEEDE9;font-family:sans-serif;">
      ${title}
    </h3>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>`
}

export async function POST(req: NextRequest) {
  try {
    const { survey, clientId } = await req.json()
    const s = survey ?? {}

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'app.yele.design').replace(/^https?:\/\//, '')

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F2F0EB;">
      <div style="max-width:620px;margin:0 auto;background:#FFFFFF;font-family:sans-serif;">

        <div style="background:#16161A;padding:22px 30px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;font-weight:700;color:#FFFFFF;">Yele</span>
          <span style="color:#D46FC8;font-size:18px;">&middot;</span>
          <span style="color:#8A8A92;font-size:12px;margin-left:6px;">New design brief</span>
        </div>

        <div style="padding:28px 30px;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#16161A;font-weight:700;">
            ${s.descripcion_negocio?.split(/[.\n]/)[0]?.trim() || 'New brief'}
          </h2>
          <p style="margin:0 0 20px;font-size:13px;color:#8A8A92;">Client ID: ${clientId ?? '—'}</p>

          ${section('Your business', [
            row('Description', s.descripcion_negocio),
            row('Service 1', [s.servicio_1_nombre, s.servicio_1_precio].filter(Boolean).join(' — ')),
            row('Service 2', [s.servicio_2_nombre, s.servicio_2_precio].filter(Boolean).join(' — ')),
            row('Service 3', [s.servicio_3_nombre, s.servicio_3_precio].filter(Boolean).join(' — ')),
            row('Ideal client', s.cliente_ideal),
            row('Differentiator', s.diferenciador),
          ].join(''))}

          ${section('Content', [
            row('Years of experience', s.anos_experiencia),
            row('Opening hours', s.horario),
            row('Service area', s.zona_cobertura),
            row('Story', s.historia),
            row('Testimonial 1', s.testimonio_1_nombre ? `${s.testimonio_1_nombre} (${s.testimonio_1_ciudad}): ${s.testimonio_1_texto}` : ''),
            row('Testimonial 2', s.testimonio_2_nombre ? `${s.testimonio_2_nombre} (${s.testimonio_2_ciudad}): ${s.testimonio_2_texto}` : ''),
            row('Testimonial 3', s.testimonio_3_nombre ? `${s.testimonio_3_nombre} (${s.testimonio_3_ciudad}): ${s.testimonio_3_texto}` : ''),
          ].join(''))}

          ${section('Visual identity', [
            row('Logo', s.tiene_logo),
            row('Logo URL', s.logo_url),
            row('Photos', s.tiene_fotos),
            row('Photos uploaded', Array.isArray(s.fotos_urls) && s.fotos_urls.length ? `${s.fotos_urls.length} photo(s)` : ''),
            row('Visual style', s.estilo_visual),
            row('References', s.referencias_urls),
            row('Brand colors', s.colores_marca),
          ].join(''))}

          ${section('The website', [
            row('Pages', Array.isArray(s.paginas) ? s.paginas.join(', ') : ''),
            row('Contact type', s.contacto_tipo),
            row('Domain', s.tiene_dominio === 'si' ? `Yes — ${s.dominio_actual}` : s.tiene_dominio),
            row('Extras', s.extras),
          ].join(''))}

          ${section('Contact and social', [
            row('Phone', s.telefono),
            row('Email', s.email_contacto),
            row('WhatsApp', s.whatsapp),
            row('Address', s.direccion),
            row('Instagram', s.instagram),
            row('Facebook', s.facebook),
            row('Google Business', s.google_business),
          ].join(''))}

          <div style="margin-top:28px;text-align:center;">
            <a href="https://${appUrl}/admin/clientes/${clientId}"
              style="display:inline-block;background:#1A1A1F;color:#FFFFFF;font-weight:700;font-size:13px;padding:14px 28px;text-decoration:none;border-radius:9999px;">
              View client &rarr;
            </a>
          </div>
        </div>

        <div style="background:#F2F0EB;padding:14px 30px;font-size:11px;color:#8A8A92;text-align:center;font-family:sans-serif;">
          Yele Studio &middot; ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </body></html>`

    await resend.emails.send({
      from: 'Yele Studio <info@yele.design>',
      to: NOTIFY_TO,
      subject: `New design brief — ${s.descripcion_negocio?.slice(0, 50) || 'client'}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[design-survey-submit]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
