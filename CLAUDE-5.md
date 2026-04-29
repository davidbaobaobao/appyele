# CLAUDE.md — Spanish SME Website Generator
# Vitrina Studio · v4.0 · Abril 2026

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Read BUILD.md** before writing a single line of code. Every client brief lives there.
  If BUILD.md does not exist, stop and ask for it.
- **Read `brand_assets/brand.md`** for all color tokens, font names, and brand values.
  If brand.md does not exist, use DEFAULT_PALETTE (see Colors section) and mark with TODO.
- **Check `brand_assets/`** for logos, photos, and any uploaded assets.
  Use them. Do not use placeholders where real assets are available.
- **Check BUILD.md for dynamic sections** — any section marked `dynamic: true` must fetch
  from Supabase, not use hardcoded content. See Dynamic Sections below.

---

## Studio Identity — Vitrina Studio

This is Vitrina Studio's operational brain. Every client site must reflect the quality
standard that Vitrina's own brand represents: Japanese-inspired minimalism, quiet
authority, craft over noise.

**Vitrina brand reference:**
- `brand_assets/brand_sheet.png` — visual reference (1200×850px)
- `brand_assets/brand.md` — complete design token system
- `brand_assets/logo_vitrina.svg` — typographic logo

**Vitrina's four design principles (apply to all work):**
```
Ma      — Negative space. Silence around every element is intentional.
Wabi    — Austere beauty. Removing is designing. Less is the decision.
Shibui  — Subtle elegance. Noticed on second look, never the first.
Seijaku — Active tranquility. The design calms — never pressures.
```

The quality bar: show the finished site to someone who doesn't know it was AI-generated.
If they assume it cost €2,000 from a design agency, the bar has been met.

---

## Per-Project Design Dials

Before writing any code, derive these three values from BUILD.md personality
and industry. State them out loud. They govern every design decision below.

```
DESIGN_VARIANCE   1–10   How experimental the layout is
                         1–3: Perfect symmetry, predictable grids
                         4–6: Modern but structured
                         7–9: Asymmetric, overlapping, grid-breaking
                         10:  Artsy chaos — only for creative/art brands

MOTION_INTENSITY  1–10   How much animation there is
                         1–3: Static or subtle hover only
                         4–6: Scroll reveals, standard transitions
                         7–9: Magnetic interactions, cinematic scrolltelling
                         10:  Full WebGL / physics-based — rare

VISUAL_DENSITY    1–10   How much content fits on one screen
                         1–3: Gallery airy — luxury, one element at a time
                         4–6: Normal spacing — typical website
                         7–10: Dense — dashboards, data-heavy (rare for SME)
```

**Default values by industry:**
```
Sport / Adventure instructor:    VARIANCE:7  MOTION:8  DENSITY:3
Restaurant / Bar:                VARIANCE:5  MOTION:4  DENSITY:4
Clinic / Health:                 VARIANCE:3  MOTION:2  DENSITY:4
Beauty / Salon:                  VARIANCE:6  MOTION:4  DENSITY:3
Trade / Fontanero:               VARIANCE:3  MOTION:2  DENSITY:5
General SME:                     VARIANCE:4  MOTION:3  DENSITY:4
```

Override defaults with BUILD.md personality if they conflict.
State the three values at the start of every session:
"VARIANCE:7 / MOTION:8 / DENSITY:3 — committing to dark cinematic aesthetic"

---

## Project Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS — but never default palette colors (see Anti-Generic Guardrails)
- **Fonts**: Google Fonts — loaded via next/font. Never system fonts.
- **Images**: next/image with proper alt text in Spanish
- **Database**: Supabase (for dynamic sections only — see Dynamic Sections below)
- **Dev server**: `npm run dev` at `http://localhost:3000`
- **Deploy**: Vercel (`vercel deploy`)
- **Language**: Spanish everywhere. No English in UI, copy, labels, or meta tags.

---

## BUILD.md Contract
BUILD.md is the single source of truth for each client. It contains:
- Business identity and real contact details
- Brand personality and visual direction
- All real content (services, prices, hours, testimonials)
- Reference component styles from 21st.dev
- Anti-patterns specific to this client
- Dynamic section flags (which sections fetch from Supabase)

**If real content exists in BUILD.md, use it.**
**Never use Lorem ipsum, placeholder names, or invented services in production builds.**
**Never use "Your Business Name" or "Add your text here" in any output.**

---

## Dynamic Sections — Supabase Integration

This is critical. Read this section before building any client site.

Some sections in BUILD.md are marked `dynamic: true` with a `table:` field.
These sections must fetch their content from Supabase at runtime.
They must NOT use hardcoded content from BUILD.md.

The client manages this content from their dashboard at app.yele.design.
When they add, edit, or remove items, the live site updates automatically within 60 seconds.

### Environment variables required for every client project

Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://wdnwacdkoowrrnyaskjl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key — get from David]
NEXT_PUBLIC_CLIENT_ID=[client UUID from Supabase clients table]
```

### Supabase client — create once per project

Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Install if needed: `npm install @supabase/supabase-js`

### Dynamic section pattern — use this exactly

Every section marked `dynamic: true` in BUILD.md must be a Next.js
server component using this pattern:

```typescript
import { supabase } from '@/lib/supabase'

// ISR — rebuilds in background every 60 seconds
export const revalidate = 60

export default async function DynamicSection() {
  const { data, error } = await supabase
    .from('TABLE_NAME')           // from BUILD.md table: field
    .select('*')
    .eq('client_id', process.env.NEXT_PUBLIC_CLIENT_ID)
    .eq('visible', true)          // only show visible items
    .order('sort_order', { ascending: true })

  // Always handle empty state — hide section entirely if no data
  if (error || !data || data.length === 0) return null

  return (
    <section>
      {data.map(item => (
        // render each item using brand tokens, never hardcoded colors
      ))}
    </section>
  )
}
```

### Table mapping — which table for each section type

```
MENU / CARTA
  table:  catalog_items
  fields: category, name, description, price, available
  group:  by category (Entrantes / Principales / Postres)
  filter: available = true only
  render: show price_label if exists, else format price as €X.XX

SERVICES / SERVICIOS
  table:  services
  fields: name, description, price, price_label
  filter: visible = true
  render: show price_label if exists, else price — never show null price

TEAM / EQUIPO
  table:  team_members
  fields: name, role, bio, photo_url
  filter: visible = true
  render: photo optional — gracefully handle missing photo_url

TESTIMONIALS / TESTIMONIOS
  table:  testimonials
  fields: author_name, role, body, rating
  filter: visible = true
  render: show stars if rating > 0, role label optional

FAQS
  table:  faqs
  fields: question, answer
  filter: visible = true
  render: accordion pattern, question bold, answer body text

OFFERS / OFERTAS
  table:  offers
  fields: title, description, badge_text, valid_until, active
  filter: active = true
          AND (valid_until IS NULL OR valid_until > NOW())
  render: badge_text as pill, valid_until as "Hasta [date]"

LISTINGS / PROPIEDADES
  table:  listings
  fields: title, type, price, size_m2, rooms, bathrooms,
          location, description, images
  filter: active = true
  render: type as "Venta" / "Alquiler" badge
          price formatted as €XXX.XXX
          images[0] as card thumbnail

GALLERY / GALERÍA
  table:  gallery
  fields: image_url, caption, category
  filter: visible = true
  render: group by category if multiple categories exist
          masonry or grid layout depending on DENSITY dial
```

### Empty state rule — mandatory

Every dynamic section must handle empty data gracefully:
- If Supabase returns 0 rows → return null (section disappears entirely)
- Never show an empty grid, blank cards, or placeholder text
- Never show "No hay elementos" to the visitor — just hide the section
- The section reappears automatically when the client adds content

### ISR revalidation — mandatory on all dynamic sections

```typescript
export const revalidate = 60
```

This tells Next.js to rebuild the page cache in the background every 60 seconds.
Visitors always get a fast cached page. Client edits appear within 60 seconds.
Never use `revalidate = 0` (disables caching) — this would make every request
hit Supabase directly and slow down the site for visitors.

### Static vs dynamic — decision rule

```
dynamic: true  in BUILD.md → fetch from Supabase, use table: field
dynamic: false in BUILD.md → use hardcoded content from BUILD.md
not specified              → use hardcoded content from BUILD.md

ALWAYS dynamic (client edits these regularly):
  ✓ Food menu / carta
  ✓ Property listings
  ✓ Offers and promotions
  ✓ Gallery photos

USUALLY dynamic (set in workflow Phase 6):
  ✓ Services list
  ✓ Team members
  ✓ Testimonials
  ✓ FAQs

ALWAYS static (never changes without a rebuild):
  ✗ Hero section (headline, CTA, background)
  ✗ About / story section
  ✗ Contact information (phone, email, address)
  ✗ Navigation and footer
  ✗ Legal pages (aviso legal, privacidad, cookies)
```

### Build order for projects with dynamic sections

1. Set up `.env.local` with Supabase credentials first
2. Create `lib/supabase.ts`
3. Build all static sections as normal (from BUILD.md)
4. Build dynamic sections last, using the fetch pattern above
5. Test each dynamic section with real data from Supabase
6. Confirm empty state works (temporarily empty the table, check section hides)
7. Run `npm run build` — fix any errors
8. Deploy to Vercel — confirm dynamic data loads on production URL

---

## Reference Components (21st.dev)
Reference components live in `/reference-components/`. These are curated from 21st.dev
by a human designer and represent the quality and style benchmark for this project.

- Use them as **style and quality inspiration** — not pixel-perfect copies
- Adapt their structure, spacing, and aesthetic to the client's brand
- Honour their level of craft: if a reference uses layered shadows and subtle animations,
  the output must match that level of refinement
- Never produce something simpler than the reference component

---

## Screenshot & Review Workflow
After building each section, take a screenshot for comparison review.

- Always serve from localhost — never screenshot a `file:///` URL
- Start dev server: `npm run dev`
- Take screenshot of `http://localhost:3000`
- Review the screenshot against BUILD.md requirements
- Check mobile at 390px width (iPhone viewport) — use Chrome DevTools device toolbar
- Do at least **2 review rounds** per section before moving to the next

**Review checklist per section:**
```
□ Content matches BUILD.md exactly (real business name, phone, hours, services)
□ Colors match brand palette from brand.md (check exact hex values)
□ Font pairing is applied correctly (display font for headlines, clean font for body)
□ Mobile layout correct at 390px — no overflow, no tiny text
□ CTA buttons are minimum 48px height, full-width on mobile
□ All text is in Spanish
□ No placeholder content anywhere
□ Interactive states exist on all clickable elements
□ Images have descriptive alt text in Spanish
□ Dynamic sections: confirm data loads from Supabase (check network tab)
□ Dynamic sections: confirm empty state hides section cleanly
```

---

## Language Rules — Spanish Everywhere
All user-facing text must be in Spanish. No exceptions.

**UI elements:**
- Buttons: "Llámanos", "Contáctanos", "Ver más", "Reservar", "Enviar mensaje", "Solicitar presupuesto"
- Navigation: "Inicio", "Servicios", "Sobre nosotros", "Contacto", "Galería"
- Forms: "Nombre", "Teléfono", "Mensaje", "Enviar"
- Footer: "Todos los derechos reservados", "Política de privacidad", "Aviso legal"
- Error messages: "Campo obligatorio", "Email no válido"

**SEO meta tags — always in Spanish:**
```html
<title>[Nombre negocio] | [Servicio principal] en [Ciudad]</title>
<meta name="description" content="[2 sentences in Spanish about the business]" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
```

**Alt text on all images — in Spanish:**
```html
<Image alt="Interior del restaurante Casa Pepe en Valencia" ... />
<Image alt="Sara García, instructora de snowboard certificada en Sierra Nevada" ... />
```

**Legal requirements (Spanish law):**
Every site must include in the footer:
- Link to "Política de privacidad" (RGPD compliance)
- Link to "Aviso legal" (business identity: name, CIF, registered address)
- Cookie consent if analytics are used

---

## Industry Aesthetics — Per Vertical Rules

Each industry has a distinct personality. Claude must commit to the correct aesthetic
before writing code. Do not apply a generic "clean modern" style across all verticals.

### Restaurantes / Bares / Tapas
```
Personality:  warm, inviting, sensory, local, authentic
Color temp:   warm — terracottas, creams, deep burgundies, olive greens
Typography:   bold serif or slab serif for headlines (Playfair Display, Lora, Fraunces)
              readable humanist sans for body (Source Sans, Nunito)
Layout:       full-bleed food photography, generous whitespace, editorial feel
Hero:         large atmospheric food/interior photo, warm overlay, centered bold headline
Avoid:        cold blues, corporate sans-serif, flat white backgrounds, grid-heavy layouts
```

### Instructores de Deportes (Snow, Surf, Climbing)
```
Personality:  energetic, adventurous, technical, personal, trustworthy
Color temp:   depends on sport — snow: icy blues + sharp whites + electric accent
              surf: ocean blues + sandy warm tones
              mountain: slate greys + alpine greens + orange accent
Typography:   strong condensed or extended sans for headlines (Barlow Condensed, Oswald,
              Anton) — conveys power and movement
              clean legible sans for body (DM Sans, Plus Jakarta Sans)
Layout:       dynamic — diagonal elements, overlapping sections, bold type over imagery
Hero:         full-bleed action shot, overlaid bold condensed type, high contrast
Avoid:        delicate serif fonts, pastel palettes, static centered layouts,
              corporate stock photos
```

### Clínicas / Fisioterapia / Salud
```
Personality:  trustworthy, calm, professional, caring, expert
Color temp:   cool — clean whites, soft blues, sage greens, light greys
Typography:   clean geometric sans for headlines (DM Sans, Outfit, Jost)
              highly readable body (Inter is acceptable HERE ONLY — clarity over character)
Layout:       structured, lots of whitespace, clear hierarchy, reassuring
Hero:         clean studio portrait of the professional, or calm abstract background
Avoid:        flashy animations, dark themes, loud colors, overly casual tone
```

### Peluquerías / Barberías / Estética
```
Personality:  stylish, personal, modern or retro (depends on brand), local
Color temp:   varies widely — read BUILD.md carefully
              Modern salon: black + white + gold accent
              Barber retro: deep greens + cream + burgundy
              Trendy: bold monochrome or unexpected color pop
Typography:   editorial — high contrast between display and body
              (Bebas Neue, Cormorant, Canela for display — depends on direction)
Layout:       strong visual identity, portfolio-forward, before/after gallery
Hero:         dramatic portrait photography, strong typography overlay
Avoid:        generic spa aesthetics, purple + white (overused in this sector)
```

### Fontaneros / Electricistas / Oficios
```
Personality:  reliable, professional, fast, local, no-nonsense
Color temp:   trustworthy — navy blues, clean whites, safety orange or yellow accent
Typography:   strong, clear, legible sans — not trendy (Roboto Condensed acceptable,
              or better: Exo 2, Rajdhani for character with clarity)
Layout:       direct and clear — services front and center, phone number massive,
              trust signals prominent (years experience, certifications, coverage area)
Hero:         professional photo of the tradesperson at work, or clean graphic
              with giant phone number CTA
Avoid:        overly designed layouts that feel untrustworthy, dark moody themes,
              anything that feels like a tech startup
```

---

## Anti-Generic Guardrails (Non-Negotiable)
These rules prevent AI-default aesthetics. Every rule applies to every project.

**Colors — brand.md is the single source of truth:**

Color palette ALWAYS comes from `brand_assets/brand.md`.
Read it before touching any color in any file.
Never invent colors. Never use Tailwind defaults as brand colors.

```
Priority order for color source:
1. brand_assets/brand.md   → ALWAYS use this when it exists
2. BUILD.md color direction → if brand.md not yet generated
3. DEFAULT_PALETTE below    → only if neither exists yet
```

**Token rule — mandatory:**
Never write raw hex values inside components. Always use CSS variables:
```css
/* WRONG — never do this in components */
background: #C4622D;
color: #2C1810;

/* CORRECT — always reference tokens */
background: var(--color-primary);
color: var(--color-dark);
```
Define all tokens once in `tailwind.config.js` from brand.md values.
Change the token once → updates everywhere. No hex hunting.

**Semantic token naming — use these names in every project:**
```css
:root {
  --color-primary:    [from brand.md]   /* main brand color */
  --color-secondary:  [from brand.md]   /* supporting color */
  --color-accent:     [from brand.md]   /* CTAs, highlights */
  --color-dark:       [from brand.md]   /* headlines, dark bg */
  --color-light:      [from brand.md]   /* backgrounds, cards */
  --color-neutral:    [from brand.md]   /* borders, dividers */
}
```

**DEFAULT_PALETTE — use only when brand.md does not exist yet:**
```css
/* Temporary professional neutral — replace when brand.md is generated */
--color-primary:    #1A1F36;   /* deep navy */
--color-secondary:  #2D3561;   /* medium navy */
--color-accent:     #C4622D;   /* terracotta */
--color-dark:       #0D0F1A;   /* near black */
--color-light:      #F5F3EE;   /* warm white */
--color-neutral:    #D4CFC8;   /* warm grey */
```

**Typography rules:**
- Never use Inter or Roboto as headline/display fonts
- Never use the same font for display and body — always a distinct pairing
- Google Fonts only — loaded via `next/font/google`, never `@import`
- Display font: loaded with `display: 'swap'`
- Body font: 400 (regular) + 500 (medium) + 600 (semibold) weights minimum

**Layout rules:**
- Never use a centered hero when DESIGN_VARIANCE > 4 — use offset/asymmetric
- Never use a generic white background with blue buttons — always brand palette
- Never use stock photo people — use abstract, product, or environment photography
- Always use `next/image` — never raw `<img>` tags

**Glassmorphism (when BUILD.md calls for it):**
```css
/* Approved ink-tinted glass — dark/photo backgrounds only */
background: rgba(14, 18, 22, 0.65);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.08);

/* NEVER use on flat light backgrounds */
/* NEVER use neon/purple/blue-glowing glass */
/* NEVER apply to elements >30% of viewport — GPU performance */
```

**Z-index scale — never deviate:**
```
0     normal flow
10    sticky elements (nav)
20    dropdowns, tooltips
40    modals, drawers
100   notifications, toasts
1000  critical overlays
```

---

## Accessibility — Priority 1 (CRITICAL)
```
Contrast:       4.5:1 minimum for normal text, 3:1 for large text
                Glass elements must still pass — test text on blurred bg
Alt text:       Every image — descriptive, in Spanish, never "image of..."
Focus rings:    Visible on every interactive element — 2px solid var(--color-accent)
                NEVER remove focus rings — keyboard users depend on them
Keyboard nav:   Tab order matches visual order
Aria labels:    Every icon-only button needs aria-label in Spanish
Skip links:     Add "Saltar al contenido principal" as first focusable element
Heading order:  h1 → h2 → h3 — never skip levels
Color not only: Never convey information by color alone — add icon or text
Form labels:    Every input has a visible <label> — never placeholder-only
```

**Form UX Rules:**
```
Validation:      Validate on blur — not on every keystroke
Error messages:  Place error directly below the field
                 Must state cause + recovery: "Email inválido — comprueba que incluye @"
Input types:     type="email" / type="tel" / type="number" / type="date"
Required fields: Mark with * and explain: "* Campos obligatorios"
Password:        Always include show/hide toggle
Multi-step:      Show step indicator (Paso 1 de 3) and allow going back
Primary CTA:     One primary CTA per section
                 Exception: homepage hero may have phone + WhatsApp as dual CTAs
```

---

## Hard Rules — Never Break These

```
DO NOT use transition-all — ever
DO NOT use raw hex values in components — always var(--color-x)
DO NOT invent colors — read brand.md or use DEFAULT_PALETTE
DO NOT use default Tailwind blue/indigo as primary brand color
DO NOT use Inter or Roboto as headline fonts
DO NOT leave Lorem ipsum in any production file
DO NOT use placehold.co in production — only in demos explicitly marked as such
DO NOT write English in any user-facing text
DO NOT build the entire site in one pass — build section by section, review each one
DO NOT use raw <img> tags — always next/image
DO NOT stop after one screenshot review pass — minimum 2 rounds per section
DO NOT add sections or features not specified in BUILD.md
DO NOT use <form> HTML tags in React — use event handlers (onClick, onChange)
DO NOT center the hero section when DESIGN_VARIANCE > 4
DO NOT generate only the success state — implement loading, empty, and error states
DO NOT mix GSAP/ThreeJS with Framer Motion in the same component tree
DO NOT remove focus rings — keyboard accessibility is mandatory
DO NOT convey information by color alone — always add icon or text
DO NOT use z-index values outside the defined scale (0/10/20/40/100/1000)
DO NOT validate forms on keystroke — validate on blur
DO NOT use glassmorphism on flat light backgrounds — only on dark/photo backgrounds
DO NOT use neon/purple/blue-glowing glass — ink-tinted glass only (rgba 20,20,16)
DO NOT apply backdrop-filter to elements covering >30% of viewport — performance
DO NOT hardcode content in dynamic sections — always fetch from Supabase
DO NOT use revalidate = 0 on dynamic sections — always use revalidate = 60
DO NOT show empty grids or blank sections — return null if no Supabase data
```

**Anti-AI Copywriting — Banned Words:**
```
Banned words:    Elevate, Seamless, Unleash, Next-Gen, Game-changer,
                 Delve, Tapestry, "In the world of...", Revolutionary,
                 Cutting-edge, Leverage, Holistic, Synergy, Empower

Banned patterns: Round numbers (use 47.2% not 50%, use €189 not €200)
                 Generic names (use María García, not Jane Smith / John Doe)
                 Exclamation marks in premium brand copy (!!! = unprofessional)

Write:           Plain, specific, honest language
                 "Aprende a leer la montaña" — not "Eleva tu experiencia"
                 "Respondo en 24 horas" — not "Atención al cliente seamless"
```

---

## Site Upgrade Protocol

When improving an existing site, apply changes in this exact order:

```
1. Font swap          — biggest instant improvement, lowest risk
2. Color cleanup      — remove clashing colors, apply CSS variables
3. Hover/active states — makes the interface feel alive immediately
4. Spacing            — double the breathing room in key sections
5. Shadow upgrade     — switch to brand-tinted layered shadows
6. Scroll animations  — add IntersectionObserver reveals
7. Hero layout        — fix centered hero if DESIGN_VARIANCE > 4
8. Glass accents      — consider glassmorphic nav if hero has dark photography
```

Never rebuild from scratch when upgrading. Diagnose first.

---

## Build Process — Always Follow This Order

```
1.  Read FRAMEWORK.md — understand business context and scope
2.  Read BUILD.md completely — client brief, requirements, dynamic section flags
3.  Read brand_assets/brand.md — all color tokens and font names
    If brand.md missing → use DEFAULT_PALETTE, mark files with TODO
4.  Read all files in /reference-components/
5.  Check brand_assets/ for logos, photos, assets
6.  Check .env.local exists with Supabase credentials (required for dynamic sections)
7.  Invoke frontend-design skill
8.  Declare the three design dials from BUILD.md personality:
    "VARIANCE:[N] / MOTION:[N] / DENSITY:[N]"
9.  State your aesthetic direction out loud before writing code:
    "I'm committing to [direction] because [reason from BUILD.md]"
10. List all dynamic sections from BUILD.md with their Supabase table names
11. Build ONE section at a time
12. Screenshot and review against checklist
13. Fix all issues found
14. Screenshot again — confirm fixed
15. Only then move to next section
```

**Section build order (standard):**
```
1. Tailwind config + CSS variables + font setup
2. lib/supabase.ts (if project has dynamic sections)
3. Navigation / Header (glassmorphic if hero uses dark photography)
4. Hero section (always static)
5. Services / Features section (static or dynamic per BUILD.md)
6. Dynamic sections (menu, listings, team, etc.) — fetch pattern
7. About / Story section (always static)
8. Testimonials (static or dynamic per BUILD.md)
9. Gallery (static or dynamic per BUILD.md)
10. Contact section (phone, WhatsApp, map if required — always static)
11. Footer (with legal links — always static)
12. SEO meta tags on all pages
13. Mobile review pass — full site at 390px
14. Performance check (npm run build — fix any errors)
15. Verify dynamic sections load data in production (check Vercel deployment)
```

---

## Performance & Legal Requirements

**Performance:**
- `next/image` handles WebP/AVIF — never use raw `<img>`
- Declare width and height on every image — CLS < 0.1
- Fonts loaded via `next/font` — never `@import` in CSS
- Lazy load all images below the fold
- Preload only the hero/critical image
- No render-blocking scripts — load third-party scripts `async` or `defer`
- `backdrop-filter` only on elements ≤30% viewport height — GPU cost
- Target: Google PageSpeed 85+ on mobile, CLS < 0.1, LCP < 2.5s
- Dynamic sections use `revalidate = 60` — never 0

**Legal (Spanish law — mandatory on every site):**
```
✓ Aviso Legal page (empresa, CIF, dirección registrada, contacto)
✓ Política de Privacidad page (RGPD compliant)
✓ Cookie banner if using analytics or tracking
✓ Footer links to both legal pages
✓ Contact form with RGPD consent checkbox
```

---

## Contact & CTA Patterns — Spanish SME Specific

Spanish SME clients receive most enquiries via phone and WhatsApp. Prioritise these.

```jsx
// Phone CTA — always clickable
<a href="tel:+34612345678">📞 612 345 678</a>

// WhatsApp CTA — highly effective in Spain
<a href="https://wa.me/34612345678?text=Hola%2C%20me%20gustaría%20más%20información"
   target="_blank" rel="noopener noreferrer">
  Escríbenos por WhatsApp
</a>

// Opening hours — always visible in footer and contact
"Lunes a Viernes: 9:00 – 14:00 y 16:00 – 20:00"
"Sábados: 10:00 – 14:00"
"Domingos: Cerrado"
```

---

## File Structure
```
/
├── CLAUDE.md                    ← this file (studio-wide, never changes per client)
├── FRAMEWORK.md                 ← business model and pipeline
├── BUILD.md                     ← client brief (one per project)
├── GENERATE_BRAND_SHEET.md      ← brand generation instructions
├── GENERATE_MEDIA_LIST.md       ← media list generation instructions
├── brand_assets/
│   ├── brand_sheet.png          ← Vitrina visual reference (1200×850px)
│   ├── brand.md                 ← Vitrina design tokens
│   ├── logo_vitrina.svg         ← Vitrina typographic logo
│   ├── logo.svg (or .png)       ← client logo (per project)
│   └── photos/                  ← client photography assets
├── media_assets/
│   ├── MEDIA_LIST.md
│   └── MEDIA_BRIEF.md
├── reference-components/
│   └── [21st.dev components]
├── lib/
│   └── supabase.ts              ← Supabase client (only if dynamic sections exist)
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── contacto/page.tsx
│   └── servicios/page.tsx
├── components/
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── Services.tsx             ← static or dynamic per BUILD.md
│   ├── Menu.tsx                 ← dynamic (catalog_items) if restaurant
│   ├── Listings.tsx             ← dynamic (listings) if inmobiliaria
│   ├── Team.tsx                 ← dynamic (team_members) if applicable
│   ├── Testimonials.tsx         ← dynamic (testimonials) if applicable
│   ├── Gallery.tsx              ← dynamic (gallery) if applicable
│   ├── FAQs.tsx                 ← dynamic (faqs) if applicable
│   ├── Offers.tsx               ← dynamic (offers) if applicable
│   ├── About.tsx
│   ├── Contact.tsx
│   └── Footer.tsx
├── public/images/
├── tailwind.config.js
├── next.config.js
└── .env.local                   ← NEVER commit this — contains Supabase keys
```
