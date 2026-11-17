import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnvngpdkqyihawrcefwr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudm5ncGRrcXlpaGF3cmNlZndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4OTM4NDMsImV4cCI6MjExMDQ2OTg0M30.Cdu3UAW8UleiThs2vLZ4t6t_eMoGVDAP37c_hF3cINw'

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      // Secure cookies in production; not in dev, so localhost still works.
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
    },
  )
}
