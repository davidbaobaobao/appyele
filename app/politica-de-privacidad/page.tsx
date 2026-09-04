import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Yele',
}

export default function PoliticaPrivacidadPage() {
  return (
    <div style={{ backgroundColor: '#F7F6F3', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-6 pt-14 pb-28">

        {/* Back */}
        <Link
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-instrument)', fontSize: '14px', color: '#8A8A92', textDecoration: 'none', marginBottom: '56px' }}
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        {/* Header */}
        <p className="yele-eyebrow" style={{ margin: '0 0 16px' }}>
          Yele Studio
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, color: '#16161A', margin: '0 0 16px' }}>
          Privacy Policy
        </h1>
        <p className="yele-eyebrow" style={{ margin: '0 0 64px' }}>
          Last updated: May 2026
        </p>

        <div style={{ fontFamily: 'var(--font-instrument)', fontSize: '16px', color: 'rgba(22,22,26,0.75)', lineHeight: '1.8' }}>

          <Section title="1. Who we are">
            <p>
              Yele Studio (hereinafter, &ldquo;Yele&rdquo; or &ldquo;we&rdquo;) is a web design and development studio that provides, through the <strong>app.yele.design</strong>{' '}platform, a digital presence management dashboard for its clients. The data controller is Yele Studio, which can be contacted at <a href="mailto:info@yele.design" style={{ color: '#16161A' }}>info@yele.design</a>.
            </p>
          </Section>

          <Section title="2. Data we collect">
            <p>When you use our platform we may collect the following data:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0 0' }}>
              <li><strong>Account data:</strong>{' '}business name, email address, phone number and password (stored in encrypted form).</li>
              <li><strong>Profile data:</strong>{' '}address, city, industry, website URL, business description and opening hours information.</li>
              <li><strong>Messages:</strong>{' '}the content of communications sent through the platform chat.</li>
              <li><strong>Usage data:</strong>{' '}pages visited, actions taken and session data, used solely to improve the service.</li>
            </ul>
          </Section>

          <Section title="3. Purpose of processing">
            <p>We use your data to:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0 0' }}>
              <li>Provide the service you have contracted (management of your digital dashboard).</li>
              <li>Send you notifications relating to your account and the service.</li>
              <li>Handle your enquiries and support requests.</li>
              <li>Improve the platform and detect technical problems.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
          </Section>

          <Section title="4. Legal basis">
            <p>
              The processing of your data is based on the performance of the service contract you accept when you register, on your express consent where applicable, and on Yele&rsquo;s legitimate interest in improving and securing the platform.
            </p>
          </Section>

          <Section title="5. Storage and providers">
            <p>
              Data is stored on secure servers managed by <strong>Supabase</strong>{' '}(infrastructure in the European Union) and is processed with the support of the following providers:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0 0' }}>
              <li><strong>Supabase</strong>{' '}— database and authentication.</li>
              <li><strong>Vercel</strong>{' '}— application hosting.</li>
              <li><strong>Resend</strong>{' '}— sending email notifications.</li>
            </ul>
            <p style={{ marginTop: '14px' }}>
              All providers are bound by data processing agreements that guarantee levels of protection equivalent to those required by the EU General Data Protection Regulation (Reglamento General de Protecci&oacute;n de Datos, RGPD / GDPR).
            </p>
          </Section>

          <Section title="6. Data retention">
            <p>
              We keep your data for as long as your account is active. After the service is cancelled, the data is deleted within a maximum of 90 days, unless there is a legal obligation to retain it for longer.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>You may exercise the following rights at any time:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0 0' }}>
              <li><strong>Access:</strong>{' '}obtain a copy of the data we hold about you.</li>
              <li><strong>Rectification:</strong>{' '}correct inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong>{' '}request the deletion of your data.</li>
              <li><strong>Portability:</strong>{' '}receive your data in a structured format.</li>
              <li><strong>Objection and restriction:</strong>{' '}object to certain processing or request that it be restricted.</li>
            </ul>
            <p style={{ marginTop: '14px' }}>
              To exercise any of these rights, write to us at <a href="mailto:info@yele.design" style={{ color: '#16161A' }}>info@yele.design</a>. We will respond within a maximum of 30 days.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We apply appropriate technical and organisational measures to protect your data against unauthorised access, loss or alteration, including encryption in transit (HTTPS/TLS) and at rest, role-based access control and periodic audits.
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              The platform uses only cookies that are strictly necessary for managing the user session. We do not use advertising cookies or third-party tracking cookies.
            </p>
          </Section>

          <Section title="10. Changes to this policy" last>
            <p>
              We may update this policy from time to time. We will give notice of significant changes through the platform or by email at least 15 days in advance. Continued use of the service after that notice implies acceptance of the updated version.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '72px', paddingTop: '28px', borderTop: '1px solid rgba(22,22,26,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#8A8A92', margin: 0 }}>
            © {new Date().getFullYear()} Yele Studio
          </p>
          <Link href="/terminos-de-uso" style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#8A8A92', textDecoration: 'underline' }}>
            Terms of use
          </Link>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : '44px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 600, letterSpacing: '-0.015em', color: '#16161A', margin: '0 0 12px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
