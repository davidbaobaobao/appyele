import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client — safe to import directly in client components
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
