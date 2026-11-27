import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { createClient } from '@/lib/supabase/server'
import { getAdminDb, getAdminRole, isAdminEmail } from '@/lib/data'
import { defaultArrivalSlots, normalizeArrivalSlots } from '@/lib/event'

export default async function DashboardPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin')
  if (!await isAdminEmail(user.email)) {
    return <main className="grid min-h-screen place-items-center bg-[#f8f6f1] p-6"><section className="rounded-2xl bg-white p-8 text-center"><h1 className="text-xl font-semibold">Accès administrateur non autorisé</h1><p className="mt-2 text-sm text-neutral-600">Votre compte n’est pas dans la liste des administrateurs autorisés.</p><form action="/auth/signout" method="post"><button className="mt-5 text-sm underline">Se déconnecter</button></form></section></main>
  }

  const role = await getAdminRole(user.email)
  const db = getAdminDb()
  const [responsesResult, settingsResult, adminsResult] = await Promise.all([
    db.from('gpo_responses').select('id,full_name,phone,respondent_type,attendance,guests_total,adults,children,attendees,arrival_slot,comment,created_at').order('created_at', { ascending: false }).limit(5000),
    db.from('gpo_settings').select('event_name,event_date,opening_hours,address,intro_text,confirmation_message,survey_open,arrival_slots').eq('id', 1).maybeSingle(),
    role?.is_owner
      ? db.from('gpo_admins').select('email,is_owner,created_at').order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ])

  return <AdminDashboard
    responses={responsesResult.error ? [] : responsesResult.data ?? []}
    settings={settingsResult.data
      ? { ...settingsResult.data, arrival_slots: normalizeArrivalSlots(settingsResult.data.arrival_slots) }
      : { event_name: null, event_date: null, opening_hours: null, address: null, intro_text: null, confirmation_message: null, survey_open: true, arrival_slots: defaultArrivalSlots }}
    admins={adminsResult.data ?? []}
    canManageAdmins={Boolean(role?.is_owner)}
  />
}
