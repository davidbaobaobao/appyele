import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidad — Yele',
}

export default function PoliticaPrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '14px', color: '#86868B', margin: '0 0 48px' }}>
          Última actualización: mayo de 2026
        </p>

        <div style={{ fontFamily: 'var(--font-instrument)', fontSize: '15px', color: '#3A3A3C', lineHeight: '1.75' }}>

          <Section title="1. Quiénes somos">
            <p>
              Yele Studio (en adelante, «Yele» o «nosotros») es un estudio de diseño y desarrollo web que ofrece, a través de la plataforma <strong>app.yele.design</strong>, un panel de gestión de presencia digital para sus clientes. El responsable del tratamiento de datos es Yele Studio, contactable en <a href="mailto:info@yele.design" style={{ color: '#1D1D1F' }}>info@yele.design</a>.
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>Al usar nuestra plataforma podemos recopilar los siguientes datos:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
              <li><strong>Datos de cuenta:</strong> nombre del negocio, correo electrónico, número de teléfono y contraseña (almacenada de forma cifrada).</li>
              <li><strong>Datos de perfil:</strong> dirección, ciudad, sector de actividad, URL del sitio web, descripción del negocio e información de horarios.</li>
              <li><strong>Mensajes:</strong> el contenido de las comunicaciones enviadas a través del chat de la plataforma.</li>
              <li><strong>Datos de uso:</strong> páginas visitadas, acciones realizadas y datos de sesión, utilizados únicamente para mejorar el servicio.</li>
            </ul>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <p>Utilizamos tus datos para:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
              <li>Prestarte el servicio contratado (gestión de tu panel digital).</li>
              <li>Enviarte notificaciones relacionadas con tu cuenta y el servicio.</li>
              <li>Atender tus consultas y solicitudes de soporte.</li>
              <li>Mejorar la plataforma y detectar problemas técnicos.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
          </Section>

          <Section title="4. Base jurídica">
            <p>
              El tratamiento de tus datos se basa en la ejecución del contrato de servicio que aceptas al registrarte, en tu consentimiento expreso cuando corresponda, y en el interés legítimo de Yele en la mejora y seguridad de la plataforma.
            </p>
          </Section>

          <Section title="5. Almacenamiento y proveedores">
            <p>
              Los datos se almacenan en servidores seguros gestionados por <strong>Supabase</strong> (infraestructura en la Unión Europea) y se procesan con el apoyo de los siguientes proveedores:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
              <li><strong>Supabase</strong> — base de datos y autenticación.</li>
              <li><strong>Vercel</strong> — alojamiento de la aplicación.</li>
              <li><strong>Resend</strong> — envío de notificaciones por correo electrónico.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Todos los proveedores están sujetos a acuerdos de procesamiento de datos que garantizan niveles de protección equivalentes a los exigidos por el RGPD.
            </p>
          </Section>

          <Section title="6. Conservación de datos">
            <p>
              Conservamos tus datos durante el tiempo en que tu cuenta esté activa. Tras la cancelación del servicio, los datos se eliminan en un plazo máximo de 90 días, salvo que exista obligación legal de conservarlos por más tiempo.
            </p>
          </Section>

          <Section title="7. Tus derechos">
            <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0' }}>
              <li><strong>Acceso:</strong> obtener una copia de los datos que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
              <li><strong>Oposición y limitación:</strong> oponerte a determinados tratamientos o solicitar su restricción.</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:info@yele.design" style={{ color: '#1D1D1F' }}>info@yele.design</a>. Responderemos en un plazo máximo de 30 días.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos frente a accesos no autorizados, pérdida o alteración, incluyendo cifrado en tránsito (HTTPS/TLS) y en reposo, control de acceso basado en roles y auditorías periódicas.
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              La plataforma utiliza únicamente cookies estrictamente necesarias para la gestión de sesión de usuario. No utilizamos cookies de publicidad ni de seguimiento de terceros.
            </p>
          </Section>

          <Section title="10. Cambios en esta política" last>
            <p>
              Podemos actualizar esta política ocasionalmente. Notificaremos cambios significativos a través de la plataforma o por correo electrónico con al menos 15 días de antelación. El uso continuado del servicio tras la notificación implica la aceptación de la versión actualizada.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '56px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#86868B', margin: 0 }}>
            © {new Date().getFullYear()} Yele Studio
          </p>
          <Link href="/terminos-de-uso" style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#86868B', textDecoration: 'underline' }}>
            Términos de uso
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
