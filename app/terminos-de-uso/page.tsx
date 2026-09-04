import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Use — Yele',
}

export default function TerminosDeUsoPage() {
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
          Terms of Use
        </h1>
        <p className="yele-eyebrow" style={{ margin: '0 0 64px' }}>
          Last updated: May 2026
        </p>

        <div style={{ fontFamily: 'var(--font-instrument)', fontSize: '16px', color: 'rgba(22,22,26,0.75)', lineHeight: '1.8' }}>

          <Section title="1. Acceptance of the terms">
            <p>
              By accessing and using the <strong>app.yele.design</strong>{' '}platform (hereinafter, &ldquo;the Platform&rdquo;), operated by Yele Studio (&ldquo;Yele&rdquo;), you agree to be bound by these Terms of Use. If you do not agree with any of them, you must stop using the Platform.
            </p>
          </Section>

          <Section title="2. Description of the service">
            <p>
              Yele provides its clients with a digital presence management dashboard that includes, among other features:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0 0' }}>
              <li>Management of the business profile and business data.</li>
              <li>Administration of website content (sections, images, text).</li>
              <li>A direct messaging channel with the Yele team.</li>
              <li>Access to web visibility statistics.</li>
            </ul>
            <p style={{ marginTop: '14px' }}>
              Access to the Platform is restricted to clients with a current contractual relationship with Yele Studio.
            </p>
          </Section>

          <Section title="3. Registration and account security">
            <p>
              To use the Platform you must create an account with an email address and password. You are responsible for keeping your credentials confidential and for all activity carried out from your account. You must notify us immediately at <a href="mailto:info@yele.design" style={{ color: '#16161A' }}>info@yele.design</a> of any unauthorised use.
            </p>
          </Section>

          <Section title="4. Acceptable use">
            <p>You agree to use the Platform only for its intended purposes and not to:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '10px 0 0' }}>
              <li>Share your access with unauthorised third parties.</li>
              <li>Publish content that is illegal, defamatory or fraudulent, or that infringes the rights of third parties.</li>
              <li>Attempt to access other clients&rsquo; data or restricted areas of the system.</li>
              <li>Reverse engineer, decompile or attempt to extract the source code of the Platform.</li>
              <li>Use automated tools to overload or disrupt the service.</li>
            </ul>
          </Section>

          <Section title="5. Intellectual property">
            <p>
              All code, design, logos and content of the Platform are the property of Yele Studio or are licensed to Yele, and are protected by the applicable intellectual property laws. No rights over them are granted beyond the access necessary to use the service.
            </p>
            <p style={{ marginTop: '14px' }}>
              The content you enter into the Platform (text, images, your business data) remains your property. You grant us a limited licence to store and display it within the service.
            </p>
          </Section>

          <Section title="6. Service availability">
            <p>
              We work to keep the Platform continuously available, but we do not guarantee 100 % availability. We may temporarily interrupt the service for maintenance, updates or reasons of force majeure, aiming to give reasonable advance notice where possible.
            </p>
          </Section>

          <Section title="7. Changes to the service">
            <p>
              Yele reserves the right to modify, extend or reduce the features of the Platform at any time. Significant changes will be communicated at least 15 days in advance through the Platform or by email.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>
              To the extent permitted by applicable law, Yele will not be liable for indirect, incidental or consequential damages arising from the use of, or the inability to use, the Platform, including loss of data or of expected profits. Yele&rsquo;s total liability towards a client will not exceed the amount paid for the service in the three months preceding the event giving rise to the claim.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              Yele may suspend or cancel your access to the Platform in the event of a breach of these Terms, with prior notice unless the seriousness of the breach justifies immediate suspension. You may request the cancellation of your account at any time by writing to <a href="mailto:info@yele.design" style={{ color: '#16161A' }}>info@yele.design</a>.
            </p>
          </Section>

          <Section title="10. Governing law and jurisdiction">
            <p>
              These Terms are governed by Spanish law (legislaci&oacute;n espa&ntilde;ola). For any dispute arising from their interpretation or performance, the parties submit to the courts and tribunals of the domicile of Yele Studio, waiving any other jurisdiction that may correspond to them, unless a mandatory legal provision states otherwise.
            </p>
          </Section>

          <Section title="11. Contact" last>
            <p>
              If you have questions about these Terms, you can contact us at{' '}
              <a href="mailto:info@yele.design" style={{ color: '#16161A' }}>info@yele.design</a>.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '72px', paddingTop: '28px', borderTop: '1px solid rgba(22,22,26,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#8A8A92', margin: 0 }}>
            © {new Date().getFullYear()} Yele Studio
          </p>
          <Link href="/politica-de-privacidad" style={{ fontFamily: 'var(--font-instrument)', fontSize: '13px', color: '#8A8A92', textDecoration: 'underline' }}>
            Privacy policy
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
