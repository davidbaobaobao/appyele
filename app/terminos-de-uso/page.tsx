import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Términos de Uso — Yele',
}

export default function TerminosDeUsoPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Back */}
        <Link
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-instrument)', fontSize: '14px', color: '#86868B', textDecoration: 'none', marginBottom: '40px' }}
        >
          <ArrowLeft size={14} />
          Volver
        </Link>

        {/* Header */}
        <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#86868B', margin: '0 0 8px' }}>
          Yele Studio
        </p>
        <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '32px', fontWeight: 700, color: '#1D1D1F', margin: '0 0 8px' }}>
          Términos de Uso
        </h1>
        <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '14px', color: '#86868B', margin: '0 0 48px' }}>
          Última actualización: mayo de 2026
        </p>

        <div style={{ fontFamily: 'var(--font-instrument)', fontSize: '15px', color: '#3A3A3C', lineHeight: '1.75' }}>

          <Section title="1. Aceptación de los términos">
            <p>
              Al acceder y utilizar la plataforma <strong>app.yele.design</strong> (en adelante, «la Plataforma»), gestionada por Yele Studio («Yele»), aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguno de ellos, debes dejar de utilizar la Plataforma.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              Yele proporciona a sus clientes un panel de gestión de presencia digital que incluye, entre otras funcionalidades:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
              <li>Gestión del perfil y datos del negocio.</li>
              <li>Administración de contenido web (secciones, imágenes, texto).</li>
              <li>Canal de mensajería directa con el equipo de Yele.</li>
              <li>Acceso a estadísticas de visibilidad web.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              El acceso a la Plataforma está restringido a clientes con una relación contractual vigente con Yele Studio.
            </p>
          </Section>

          <Section title="3. Registro y seguridad de la cuenta">
            <p>
              Para usar la Plataforma es necesario crear una cuenta con un correo electrónico y contraseña. Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades realizadas desde tu cuenta. Debes notificarnos inmediatamente a <a href="mailto:info@yele.design" style={{ color: '#1D1D1F' }}>info@yele.design</a> ante cualquier uso no autorizado.
            </p>
          </Section>

          <Section title="4. Uso aceptable">
            <p>Te comprometes a usar la Plataforma únicamente para los fines previstos y a no:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
              <li>Compartir tu acceso con terceros no autorizados.</li>
              <li>Publicar contenido ilegal, difamatorio, fraudulento o que infrinja derechos de terceros.</li>
              <li>Intentar acceder a datos de otros clientes o a áreas restringidas del sistema.</li>
              <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la Plataforma.</li>
              <li>Utilizar herramientas automatizadas para sobrecargar o interrumpir el servicio.</li>
            </ul>
          </Section>

          <Section title="5. Propiedad intelectual">
            <p>
              Todo el código, diseño, logotipos y contenidos de la Plataforma son propiedad de Yele Studio o están licenciados a Yele, y están protegidos por las leyes de propiedad intelectual aplicables. No se concede ningún derecho sobre ellos más allá del acceso necesario para usar el servicio.
            </p>
            <p style={{ marginTop: '12px' }}>
              El contenido que tú introduces en la Plataforma (textos, imágenes, datos de tu negocio) sigue siendo de tu propiedad. Nos otorgas una licencia limitada para almacenarlo y mostrarlo dentro del servicio.
            </p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>
              Nos esforzamos por mantener la Plataforma disponible de forma continua, pero no garantizamos una disponibilidad del 100 %. Podemos interrumpir temporalmente el servicio por mantenimiento, actualizaciones o causas de fuerza mayor, procurando avisar con antelación razonable cuando sea posible.
            </p>
          </Section>

          <Section title="7. Modificaciones del servicio">
            <p>
              Yele se reserva el derecho a modificar, ampliar o reducir las funcionalidades de la Plataforma en cualquier momento. Los cambios significativos se comunicarán con al menos 15 días de antelación a través de la Plataforma o por correo electrónico.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              En la medida permitida por la ley aplicable, Yele no será responsable de daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de usar la Plataforma, incluyendo pérdida de datos o de beneficios esperados. La responsabilidad total de Yele frente a un cliente no superará el importe pagado por el servicio en los tres meses anteriores al evento que origina la reclamación.
            </p>
          </Section>

          <Section title="9. Rescisión">
            <p>
              Yele puede suspender o cancelar tu acceso a la Plataforma en caso de incumplimiento de estos Términos, previa notificación salvo que la gravedad del incumplimiento justifique una suspensión inmediata. Tú puedes solicitar la cancelación de tu cuenta en cualquier momento escribiendo a <a href="mailto:info@yele.design" style={{ color: '#1D1D1F' }}>info@yele.design</a>.
            </p>
          </Section>

          <Section title="10. Ley aplicable y jurisdicción">
            <p>
              Estos Términos se rigen por la legislación española. Para cualquier controversia derivada de su interpretación o cumplimiento, las partes se someten a los juzgados y tribunales del domicilio de Yele Studio, con renuncia a cualquier otro fuero que pudiera corresponderles, salvo disposición legal imperativa en contrario.
            </p>
          </Section>

          <Section title="11. Contacto" last>
            <p>
              Si tienes preguntas sobre estos Términos, puedes contactarnos en{' '}
              <a href="mailto:info@yele.design" style={{ color: '#1D1D1F' }}>info@yele.design</a>.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '56px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#86868B', margin: 0 }}>
            © {new Date().getFullYear()} Yele Studio
          </p>
          <Link href="/politica-de-privacidad" style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#86868B', textDecoration: 'underline' }}>
            Política de privacidad
          </Link>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : '36px' }}>
      <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: '17px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 10px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
