import { createClient } from '@/lib/supabase/server'
import { getAdminRole, isAdminEmail } from '@/lib/data'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdminEmail(user.email))) return null
  return user
}

export async function requireOwnerAdmin() {
  const user = await requireAdmin()
  if (!user?.email) return null
  const role = await getAdminRole(user.email)
  return role?.is_owner ? user : null
}
