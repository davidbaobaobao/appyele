import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_TO = ['info@yele.design', 'davidbaobaobao@gmail.com']

function row(label: string, value: string) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:5px 0;font-size:12px;color:#86868B;width:150px;vertical-align:top;font-family:sans-serif;">${label}</td>
      <td style="padding:5px 0;font-size:13px;color:#1D1D1F;vertical-align:top;font-family:sans-serif;">${value.replace(/\n/g, '<br>')}</td>
    </tr>`
}

function section(title: string, rows: string) {
  if (!rows.trim()) return ''
  return `
    <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#86868B;margin:24px 0 8px;padding-bottom:6px;border-bottom:1px solid #F0F0F0;font-family:sans-serif;">
      ${title}
    </h3>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>`
}

export async function POST(req: NextRequest) {
  try {
    const { survey, clientId } = await req.json()
    const s = survey ?? {}

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'app.yele.design').replace(/^https?:\/\//, '')

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F7;">
      <div style="max-width:620px;margin:0 auto;background:#FFFFFF;font-family:sans-serif;">

        <div style="background:#1D1D1F;padding:22px 30px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;font-weight:700;color:#FFFFFF;">Yele</span>
          <span style="color:#E8A020;font-size:18px;">·</span>
          <span style="color:#86868B;font-size:12px;margin-left:6px;">Nuevo briefing de diseño</span>
        </div>

        <div style="padding:28px 30px;">
          <h2 style="margin:0 0 4px;font-size:20px;color:#1D1D1F;font-weight:700;">
            ${s.descripcion_negocio?.split(/[.\n]/)[0]?.trim() || 'Nuevo briefing'}
          </h2>
          <p style="margin:0 0 20px;font-size:13px;color:#86868B;">ID de cliente: ${clientId ?? '—'}</p>

          ${section('Tu negocio', [
            row('Descripción', s.descripcion_negocio),
            row('Servicio 1', [s.servicio_1_nombre, s.servicio_1_precio].filter(Boolean).join(' — ')),
            row('Servicio 2', [s.servicio_2_nombre, s.servicio_2_precio].filter(Boolean).join(' — ')),
            row('Servicio 3', [s.servicio_3_nombre, s.servicio_3_precio].filter(Boolean).join(' — ')),
            row('Cliente ideal', s.cliente_ideal),
            row('Diferenciador', s.diferenciador),
          ].join(''))}

          ${section('Contenido', [
            row('Años experiencia', s.anos_experiencia),
            row('Horario', s.horario),
            row('Zona de cobertura', s.zona_cobertura),
            row('Historia', s.historia),
            row('Testimonio 1', s.testimonio_1_nombre ? `${s.testimonio_1_nombre} (${s.testimonio_1_ciudad}): ${s.testimonio_1_texto}` : ''),
            row('Testimonio 2', s.testimonio_2_nombre ? `${s.testimonio_2_nombre} (${s.testimonio_2_ciudad}): ${s.testimonio_2_texto}` : ''),
            row('Testimonio 3', s.testimonio_3_nombre ? `${s.testimonio_3_nombre} (${s.testimonio_3_ciudad}): ${s.testimonio_3_texto}` : ''),
          ].join(''))}

          ${section('Identidad visual', [
            row('Logo', s.tiene_logo),
            row('URL logo', s.logo_url),
            row('Fotos', s.tiene_fotos),
            row('Fotos subidas', Array.isArray(s.fotos_urls) && s.fotos_urls.length ? `${s.fotos_urls.length} foto(s)` : ''),
            row('Estilo visual', s.estilo_visual),
            row('Referencias', s.referencias_urls),
            row('Colores de marca', s.colores_marca),
          ].join(''))}

          ${section('La web', [
            row('Páginas', Array.isArray(s.paginas) ? s.paginas.join(', ') : ''),
            row('Tipo de contacto', s.contacto_tipo),
            row('Dominio', s.tiene_dominio === 'si' ? `Sí — ${s.dominio_actual}` : s.tiene_dominio),
            row('Extras', s.extras),
          ].join(''))}

          ${section('Contacto y redes', [
            row('Teléfono', s.telefono),
            row('Email', s.email_contacto),
            row('WhatsApp', s.whatsapp),
            row('Dirección', s.direccion),
            row('Instagram', s.instagram),
            row('Facebook', s.facebook),
            row('Google Business', s.google_business),
          ].join(''))}

          <div style="margin-top:28px;text-align:center;">
            <a href="https://${appUrl}/admin/clientes/${clientId}"
              style="display:inline-block;background:#1D1D1F;color:#FFFFFF;font-weight:700;font-size:13px;padding:14px 28px;text-decoration:none;border-radius:8px;">
              Ver cliente en el panel →
            </a>
          </div>
        </div>

        <div style="background:#F5F5F7;padding:14px 30px;font-size:11px;color:#86868B;text-align:center;font-family:sans-serif;">
          Yele Studio · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </body></html>`

    await resend.emails.send({
      from: 'Yele Studio <info@yele.design>',
      to: NOTIFY_TO,
      subject: `Nuevo briefing de diseño — ${s.descripcion_negocio?.slice(0, 50) || 'cliente'}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[design-survey-submit]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
