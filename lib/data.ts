import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pnvngpdkqyihawrcefwr.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Supabase server credentials are missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
import { createHash } from 'node:crypto'
export async function getResponseForEdit(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  try {
    const { data } = await getAdminDb().from('gpo_responses').select('full_name,phone,respondent_type,attendance,guests_total,adults,children,attendees,arrival_slot,comment').eq('edit_token_hash',createHash('sha256').update(token).digest('hex')).maybeSingle()
    return data ?? null
  } catch { return null }
}

export async function getEventSettings() {
  try { const { data } = await getAdminDb().from('gpo_settings').select('event_date,address').eq('id',1).maybeSingle(); return data ?? { event_date: null, address: null } } catch { return { event_date: null, address: null } }
}
export async function getAdminRole(email?: string) {
  if (!email) return null
  try {
    const { data } = await getAdminDb()
      .from('gpo_admins')
      .select('email,is_owner,created_at')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()
    return data ?? null
  } catch {
    return null
  }
}

export async function isAdminEmail(email?: string) {
  if (!email) return false
  if (await getAdminRole(email)) return true
  return Boolean(
    process.env.ADMIN_EMAILS
      ?.split(',')
      .map(value => value.trim().toLowerCase())
      .includes(email.trim().toLowerCase()),
  )
}
