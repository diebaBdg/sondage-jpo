'use client'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, Check, Download, ExternalLink, ListFilter as Filter, LogOut, MapPin, Search, Send, Trash2, Users, UserRound, UserRoundCheck, UserRoundX, Clock, Settings, Copy, Save, LoaderCircle, Baby, PersonStanding } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ResponseActions } from '@/components/response-actions'
import { AdminManagement } from '@/components/admin-management'
import { AdminResponse, AdminResponseCreate } from '@/components/admin-response-create'
import { EventSettings, attendanceStatus, getLegacyAttendeeType, normalizeAttendeeProfile, profileLabels, AttendeeProfile } from '@/lib/event'

type Response = AdminResponse
type ResponseAttendee = AdminResponse['attendees'][number]

function getResponseAttendees(response: Response): ResponseAttendee[] {
  if (response.attendees?.length) {
    return response.attendees.map((person, index) => ({
      ...person,
      profile: normalizeAttendeeProfile(person.profile ?? (index === 0 ? response.respondent_type : person.type === 'child' ? 'student' : 'guest')),
    }))
  }
  if (response.attendance !== 'yes') return []
  const leadType: ResponseAttendee['type'] = response.adults > 0 ? 'adult' : 'child'
  const adultsToAdd = Math.max(0, response.adults - (leadType === 'adult' ? 1 : 0))
  const childrenToAdd = Math.max(0, response.children - (leadType === 'child' ? 1 : 0))
  return [
    { name: response.full_name, type: leadType, profile: normalizeAttendeeProfile(response.respondent_type) },
    ...Array.from({ length: adultsToAdd }, () => ({ name: 'Nom non renseigné', type: 'adult' as const, profile: 'guest' as const })),
    ...Array.from({ length: childrenToAdd }, () => ({ name: 'Nom non renseigné', type: 'child' as const, profile: 'student' as const })),
  ]
}

export function AdminDashboard({ responses: initial, settings: initialSettings, admins, canManageAdmins }: {
  responses: Response[]
  settings: EventSettings
  admins: { email: string; is_owner: boolean; created_at: string }[]
  canManageAdmins: boolean
}) {
  const slots = initialSettings.arrival_slots
  const [rows, setRows] = useState(initial)
  const [settings, setSettings] = useState(initialSettings)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [hourFilter, setHourFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const confirmed = rows.filter(row => row.attendance === 'yes')
  const totalAdults = confirmed.reduce((total, row) => total + row.adults, 0)
  const totalChildren = confirmed.reduce((total, row) => total + row.children, 0)
  const chartData = slots.map(hour => ({ hour, count: confirmed.filter(row => row.arrival_slot === hour).reduce((sum, row) => sum + row.guests_total, 0) }))
  const busiest = chartData.reduce((best, current) => current.count > best.count ? current : best, chartData[0] ?? { hour: '—', count: 0 })
  const filtered = useMemo(() => rows.filter(row =>
    (row.full_name.toLowerCase().includes(query.toLowerCase()) || (row.phone ?? '').includes(query))
    && (statusFilter === 'all' || row.attendance === statusFilter)
    && (typeFilter === 'all' || row.respondent_type === typeFilter)
    && (hourFilter === 'all' || row.arrival_slot === hourFilter)
  ), [rows, query, statusFilter, typeFilter, hourFilter])
  const totals = confirmed.reduce((total, row) => total + row.guests_total, 0)

  async function remove(row: Response) {
    if (!window.confirm(`Supprimer la réponse de ${row.full_name} ? Cette action est définitive.`)) return
    const res = await fetch(`/api/admin/responses/${row.id}`, { method: 'DELETE' })
    if (res.ok) setRows(rows.filter(item => item.id !== row.id))
    else setNotice('La suppression a échoué.')
  }

  function exportRows(format: 'xlsx' | 'csv') {
    const data = filtered.map((row, index) => ({
      'N°': index + 1,
      'Nom complet': row.full_name,
      'Participants (profil)': getResponseAttendees(row).map(person => `${person.name} (${profileLabels[person.profile ?? 'guest']})`).join(' · '),
      'WhatsApp': row.phone ?? '',
      'Vous êtes': profileLabels[row.respondent_type],
      'Statut': attendanceStatus[row.attendance].label,
      'Adultes': row.adults,
      'Enfants': row.children,
      'Visiteurs': row.guests_total,
      'Heure estimée': row.arrival_slot ?? '',
      'Date de réponse': new Date(row.created_at).toLocaleString('fr-FR'),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Présences JPO')
    XLSX.writeFile(wb, `rahmah-jpo-presences.${format}`, { bookType: format })
  }

  function pdf() {
    import('jspdf').then(({ default: jsPDF }) => import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('RAHMAH – 25 ans — JPO', 14, 18)
      doc.setFontSize(9)
      doc.text(`Réponses : ${rows.length} · Confirmés : ${confirmed.length} · Visiteurs estimés : ${totals} (dont ${totalAdults} adultes, ${totalChildren} enfants)`, 14, 26)
      autoTable(doc, {
        startY: 34,
        head: [['N°', 'Nom', 'WhatsApp', 'Vous êtes', 'Statut', 'Adultes', 'Enfants', 'Heure']],
        body: filtered.map((row, index) => [String(index + 1), row.full_name, row.phone ?? '', profileLabels[row.respondent_type], attendanceStatus[row.attendance].label, String(row.adults), String(row.children), row.arrival_slot ?? '—']),
        styles: { fontSize: 8 },
      })
      doc.save('rahmah-jpo-recapitulatif.pdf')
    }))
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...settings, arrival_slots: slots }),
    })
    setBusy(false)
    setNotice(res.ok ? 'Configuration enregistrée.' : 'Impossible d’enregistrer la configuration.')
    if (res.ok) setSettingsOpen(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.origin)
    setNotice('Lien public copié.')
  }

  return <main className="min-h-screen bg-[#f8f6f1] text-[#302739]">
    <header className="border-b border-[#e9e3ec] bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a href="/" className="flex items-center gap-3">
          <img src="/icon.svg" alt="Logo de l’école Rahmah" className="size-12 shrink-0 rounded-xl object-contain sm:size-14" />
          <span><span className="block text-xs font-extrabold tracking-[.16em]">RAHMAH – 25 ANS</span><span className="text-[10px] font-medium text-[#84748e]">SONDAGE JPO · TABLEAU DE BORD</span></span>
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copyLink} className="flex items-center gap-2 rounded-xl border border-[#e7e0e9] px-3 py-2 text-xs font-semibold"><Copy size={14}/> Copier le lien public</button>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="rounded-xl border border-[#e7e0e9] p-2.5" aria-label="Paramètres de l’événement"><Settings size={16}/></button>
          <form action="/auth/signout" method="post"><button className="flex items-center gap-2 rounded-xl bg-[#f4f0f6] px-3 py-2.5 text-xs font-semibold text-[#5d456d]"><LogOut size={14}/> Quitter</button></form>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#478d86]">Vue d’ensemble</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#382746] sm:text-3xl">Suivi des présences</h1>
          <p className="mt-1 text-sm text-[#847b88]">Gérez les réponses, les profils visiteurs et l’accueil de la JPO.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportRows('xlsx')} className="flex items-center gap-2 rounded-xl border border-[#e7e0e9] bg-white px-3 py-2.5 text-xs font-semibold"><Download size={14}/> Excel</button>
          <button onClick={() => exportRows('csv')} className="flex items-center gap-2 rounded-xl border border-[#e7e0e9] bg-white px-3 py-2.5 text-xs font-semibold"><Download size={14}/> CSV</button>
          <button onClick={pdf} className="flex items-center gap-2 rounded-xl bg-[#4b3260] px-3 py-2.5 text-xs font-semibold text-white"><Download size={14}/> PDF</button>
        </div>
      </div>
      {notice && <div role="status" className="mb-4 flex items-center justify-between rounded-xl bg-[#e8f5f2] px-4 py-3 text-sm text-[#347c73]">{notice}<button onClick={() => setNotice('')} aria-label="Fermer">×</button></div>}
      {settingsOpen && <form onSubmit={saveSettings} className="mb-6 grid gap-4 rounded-2xl border border-[#e9e3ec] bg-white p-5 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Nom de l’événement<input value={settings.event_name ?? ''} onChange={e => setSettings({ ...settings, event_name: e.target.value })} maxLength={120} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Date de la JPO<input type="date" value={settings.event_date ?? ''} onChange={e => setSettings({ ...settings, event_date: e.target.value })} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Horaires d’ouverture<input value={settings.opening_hours ?? ''} onChange={e => setSettings({ ...settings, opening_hours: e.target.value })} maxLength={120} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Adresse<input value={settings.address ?? ''} onChange={e => setSettings({ ...settings, address: e.target.value })} maxLength={250} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold sm:col-span-2">Texte d’introduction du sondage<textarea value={settings.intro_text ?? ''} onChange={e => setSettings({ ...settings, intro_text: e.target.value })} maxLength={500} rows={2} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold sm:col-span-2">Message de confirmation après envoi<textarea value={settings.confirmation_message ?? ''} onChange={e => setSettings({ ...settings, confirmation_message: e.target.value })} maxLength={300} rows={2} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold sm:col-span-2">Créneaux d’arrivée (un par ligne)
            <textarea value={slots.join('\n')} onChange={e => setSettings({ ...settings, arrival_slots: e.target.value.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 12) })} rows={4} className="mt-2 w-full rounded-lg border p-2.5 text-sm"/>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#eee9f0] bg-[#fcfbfc] p-3 sm:col-span-2">
            <input type="checkbox" checked={settings.survey_open} onChange={e => setSettings({ ...settings, survey_open: e.target.checked })} className="size-4 accent-[#55396b]"/>
            <span className="text-xs leading-5 text-[#766e79]">Sondage ouvert (les visiteurs peuvent répondre)</span>
          </label>
        </div>
        <div className="flex flex-col justify-between gap-3">
          <p className="rounded-xl bg-[#faf8fb] p-3 text-xs leading-5 text-[#847b88]">Ces réglages s’appliquent à la page publique : nom de l’événement, date, horaires, adresse, textes, créneaux proposés et ouverture du sondage. Pensez à enregistrer après modification.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSettingsOpen(false)} className="min-h-10 rounded-xl border border-[#e7e0e9] px-4 text-sm font-semibold text-[#604a70]">Annuler</button>
            <button disabled={busy} className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#4b3260] px-4 py-2.5 text-xs font-semibold text-white">{busy ? <LoaderCircle size={14} className="animate-spin"/> : <Save size={14}/>} Enregistrer</button>
          </div>
        </div>
      </form>}
      {canManageAdmins && <AdminManagement initialAdmins={admins}/>}
      <AdminResponseCreate onCreated={response => { setRows(current => [response, ...current]); setNotice('Réponse ajoutée manuellement.') }} slots={slots}/>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={<Send/>} label="Réponses reçues" value={rows.length} hint="Tous les statuts"/>
        <Metric icon={<UserRoundCheck/>} label="Présences confirmées" value={confirmed.length} hint="Réponses oui"/>
        <Metric icon={<UserRoundX/>} label="Réponses négatives" value={rows.filter(row => row.attendance === 'no').length} hint="Ne pourront pas venir"/>
        <Metric icon={<UserRound/>} label="Réponses incertaines" value={rows.filter(row => row.attendance === 'maybe').length} hint="Pas encore sûr(es)"/>
        <Metric icon={<Users/>} label="Visiteurs estimés" value={totals} hint="Présences confirmées"/>
        <Metric icon={<PersonStanding/>} label="Adultes / enfants" value={totalAdults} hint={`${totalChildren} enfant(s) confirmé(s)`}/>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-[#e9e3ec] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#493653]">Visiteurs par heure</h2>
              <p className="mt-1 text-xs text-[#928996]">Estimation des visiteurs confirmés{busiest?.count ? ` · créneau le plus fréquenté : ${busiest.hour}` : ''}</p>
            </div>
            <Clock size={18} className="text-[#398d85]"/>
          </div>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="#eee9f0"/>
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#887d8e' }} axisLine={false} tickLine={false} interval={0}/>
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#a39aa7' }} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{ fill: '#f6f3f7' }}/>
                <Bar dataKey="count" name="Visiteurs" fill="#57bdb2" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e9e3ec] bg-white p-5">
          <h2 className="font-semibold text-[#493653]">Configuration événement</h2>
          <p className="mt-1 text-xs text-[#928996]">Informations visibles sur la page publique</p>
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#faf8fb] p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-[#6d547c]"><CalendarDays size={16}/></span>
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#9b91a0]">Date</p><p className="text-sm font-medium">{settings.event_date ? new Date(`${settings.event_date}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : 'À renseigner'}</p></div>
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#faf8fb] p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-[#6d547c]"><MapPin size={16}/></span>
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#9b91a0]">Lieu</p><p className="text-sm font-medium">{settings.address || 'À renseigner'}</p></div>
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#faf8fb] p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-[#6d547c]"><Baby size={16}/></span>
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-[#9b91a0]">Répartition confirmée</p><p className="text-sm font-medium">{totalAdults} adulte(s) · {totalChildren} enfant(s)</p></div>
          </div>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#5d456d]">Modifier les paramètres <ExternalLink size={13}/></button>
        </section>
      </div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9e3ec] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9f0] p-4 sm:p-5">
          <div>
            <h2 className="font-semibold text-[#493653]">Réponses</h2>
            <p className="mt-1 text-xs text-[#928996]">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} · Informations visibles uniquement aux organisateurs</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-3 text-[#9b91a0]"/>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom ou WhatsApp" className="w-44 rounded-lg border border-[#e9e3ec] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#6a4b7e]"/>
            </label>
            <label className="relative">
              <Filter size={13} className="absolute left-2.5 top-2.5 text-[#8e8195]"/>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-[#e9e3ec] py-2 pl-8 pr-2 text-xs">
                <option value="all">Tous les statuts</option><option value="yes">Confirmé</option><option value="maybe">Incertain</option><option value="no">Décliné</option>
              </select>
            </label>
            <select aria-label="Filtrer par profil" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border border-[#e9e3ec] px-2 py-2 text-xs">
              <option value="all">Tous les profils</option>
              {(Object.keys(profileLabels) as AttendeeProfile[]).map(value => <option key={value} value={value}>{profileLabels[value]}</option>)}
            </select>
            <select aria-label="Filtrer par heure d’arrivée" value={hourFilter} onChange={e => setHourFilter(e.target.value)} className="rounded-lg border border-[#e9e3ec] px-2 py-2 text-xs">
              <option value="all">Toutes les heures</option>
              {slots.map(slot => <option key={slot}>{slot}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[#faf9fb] text-[10px] uppercase tracking-wide text-[#968c9a]">
              <tr>{['N°', 'Répondant / participants', 'WhatsApp', 'Vous êtes', 'Statut', 'Adultes', 'Enfants', 'Arrivée', 'Réponse', ''].map((header, index) => <th key={index} className={`px-4 py-3 font-semibold ${index === 0 ? 'w-10 text-center' : ''}`}>{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#f0edf1]">
              {filtered.map((row, index) => <tr key={row.id} className="hover:bg-[#fcfbfc]">
                <td className="px-4 py-3 text-center font-semibold text-[#8d8293]">{index + 1}</td>
                <td className="min-w-52 px-4 py-3 align-top">
                  <p className="font-semibold text-[#483b50]">{row.full_name}</p>
                  {row.attendance === 'yes' && <ul className="mt-1 flex flex-col gap-0.5 text-[10px] leading-4 text-[#847b88]">{getResponseAttendees(row).map((person, personIndex) => <li key={`${row.id}-${personIndex}`}>{person.name} · {profileLabels[person.profile ?? 'guest']}</li>)}</ul>}
                </td>
                <td className="px-4 py-3 text-[#786f7d]">{row.phone || '—'}</td>
                <td className="px-4 py-3">{profileLabels[row.respondent_type]}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${attendanceStatus[row.attendance].cls}`}>{attendanceStatus[row.attendance].label}</span></td>
                <td className="px-4 py-3">{row.adults}</td>
                <td className="px-4 py-3">{row.children}</td>
                <td className="px-4 py-3">{row.arrival_slot ?? '—'}</td>
                <td className="px-4 py-3 text-[#897f8c]">{new Date(row.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3"><ResponseActions row={row} slots={slots} onDelete={() => remove(row)} onSaved={updated => setRows(rows.map(item => item.id === updated.id ? updated : item))}/></td>
              </tr>)}
              {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-[#968c9a]">Aucune réponse correspondante.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) {
  return <article className="rounded-2xl border border-[#e9e3ec] bg-white p-5">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#827889]">{label}</span><span className="grid size-9 place-items-center rounded-xl bg-[#f2eef5] text-[#644c75]">{icon}</span></div>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-[#3e2d4d]">{value.toLocaleString('fr-FR')}</p>
    <p className="mt-1 text-[11px] text-[#9b91a0]">{hint}</p>
  </article>
}
