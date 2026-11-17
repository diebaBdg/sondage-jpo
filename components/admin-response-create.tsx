'use client'

import { FormEvent, useState } from 'react'
import { Check, ChevronDown, LoaderCircle, Plus } from 'lucide-react'
import { Attendee, AttendeeFields } from '@/components/attendee-fields'

export type AdminResponse = {
  id: string
  full_name: string
  phone: string | null
  respondent_type: 'parent' | 'alumni' | 'student' | 'family' | 'friend' | 'guest' | 'other'
  attendance: 'yes' | 'no' | 'maybe'
  guests_total: number
  adults: number
  children: number
  attendees: Attendee[]
  arrival_slot: string | null
  comment: string | null
  created_at: string
}

type Companion = Attendee & { id: string }
const respondentTypes = [['parent','Parent d’élève'],['alumni','Ancien(ne) élève'],['student','Élève'],['family','Membre de la famille'],['friend','Ami(e)'],['guest','Invité(e)'],['other','Autre']] as const
const slots = ['09h–10h','10h–11h','11h–12h','12h–13h','13h–14h','14h–15h','15h–16h','16h–17h']
const field = 'mt-1 w-full rounded-xl border border-[#e7e0e9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6a4b7e]'

export function AdminResponseCreate({ onCreated }: { onCreated: (response: AdminResponse) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [attendance, setAttendance] = useState<'yes' | 'no' | 'maybe'>('yes')
  const [leadName, setLeadName] = useState('')
  const [leadType, setLeadType] = useState<Attendee['type']>('adult')
  const [companions, setCompanions] = useState<Companion[]>([])
  const [success, setSuccess] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    const attendees: Attendee[] = attendance === 'yes' ? [{ name: leadName.trim(), type: leadType }, ...companions.map(({ name, type }) => ({ name: name.trim(), type }))] : []
    const adults = attendees.filter(person => person.type === 'adult').length
    const payload = {
      full_name: leadName.trim(),
      phone: String(form.get('phone') ?? '').trim(),
      respondent_type: String(form.get('respondent_type') ?? ''),
      attendance,
      guests_total: attendees.length,
      adults,
      children: attendees.length - adults,
      attendees,
      arrival_slot: attendance === 'yes' ? String(form.get('arrival_slot') ?? '') : null,
      comment: String(form.get('comment') ?? ''),
      consent: form.get('consent') === 'on',
    }
    const response = await fetch('/api/admin/responses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const result = await response.json()
    setSaving(false)
    if (!response.ok) {
      setError(result.error ?? 'Impossible d’ajouter cette réponse.')
      return
    }
    onCreated(result.response)
    setSuccess('Réponse ajoutée au tableau de bord.')
    setOpen(false)
    setLeadName('')
    setCompanions([])
    setAttendance('yes')
  }

  return (
    <section className="mb-5 rounded-2xl border border-[#e9e3ec] bg-white p-4 sm:p-5">
      <button type="button" aria-expanded={open} onClick={() => { setOpen(value => !value); setError('') }} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4b3260] px-4 py-3 text-sm font-semibold text-white sm:w-auto"><Plus size={16}/> Ajouter une réponse manuellement</button>
      {success && !open && <p role="status" className="mt-3 text-xs text-[#347c73]">{success}</p>}
      {open && <form onSubmit={submit} className="mt-5 rounded-xl border border-[#eee9f0] bg-[#fcfbfc] p-4 sm:p-5">
        <div className="mb-4"><h2 className="font-semibold text-[#493653]">Nouvelle réponse</h2><p className="mt-1 text-xs leading-5 text-[#847b88]">Ajoutez les coordonnées puis le nom et la catégorie de chaque personne présente.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#514658]">Nom et prénom *<input required minLength={2} maxLength={120} value={leadName} onChange={event => setLeadName(event.target.value)} className={field}/></label>
          <label className="text-xs font-semibold text-[#514658]">Téléphone WhatsApp <span className="font-normal text-[#968c9b]">(facultatif)</span><input name="phone" type="tel" maxLength={30} className={field}/></label>
          <label className="text-xs font-semibold text-[#514658]">Profil *<select required name="respondent_type" defaultValue="" className={field}><option value="" disabled>Choisir un profil</option>{respondentTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-[#514658]">Présence *<select value={attendance} onChange={event => setAttendance(event.target.value as typeof attendance)} className={field}><option value="yes">Confirmée</option><option value="no">Déclinée</option><option value="maybe">Incertaine</option></select></label>
        </div>
        {attendance === 'yes' && <div className="mt-5 rounded-xl bg-[#f9f7fa] p-4"><h3 className="text-sm font-semibold text-[#473653]">Personnes présentes</h3><AttendeeFields leadName={leadName} leadType={leadType} onLeadTypeChange={setLeadType} companions={companions} onCompanionsChange={setCompanions}/><label className="mt-4 block text-xs font-medium text-[#64596a]">Heure d’arrivée estimée *<span className="relative block"><select required name="arrival_slot" defaultValue="" className={field}><option value="" disabled>Choisir un créneau</option>{slots.map(slot => <option key={slot}>{slot}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-[#84758c]"/></span></label></div>}
        <label className="mt-4 block text-xs font-semibold text-[#514658]">Commentaire (facultatif)<textarea name="comment" maxLength={1000} rows={2} className={field}/></label>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#eee9f0] bg-white p-3"><input required name="consent" type="checkbox" className="mt-0.5 size-4 accent-[#55396b]"/><span className="text-xs leading-5 text-[#766e79]">La personne a donné son accord à l’utilisation de ces informations pour l’organisation de la JPO. *</span></label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-xl border border-[#e7e0e9] px-4 text-sm font-semibold text-[#604a70]">Annuler</button><button disabled={saving} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4b3260] px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin"/> : <Check size={15}/>} Enregistrer la réponse</button></div>
      </form>}
    </section>
  )
}
