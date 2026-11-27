'use client'

import { FormEvent, useState } from 'react'
import { LoaderCircle, Pencil, Save, Trash2, X } from 'lucide-react'
import { Attendee, AttendeeFields, AttendeeProfile, attendeeProfiles, getLegacyAttendeeType, normalizeAttendeeProfile } from '@/components/attendee-fields'

type Row = {
  id: string
  full_name: string
  phone: string | null
  respondent_type: AttendeeProfile
  attendance: 'yes' | 'no' | 'maybe'
  guests_total: number
  adults: number
  children: number
  attendees: Attendee[]
  arrival_slot: string | null
  comment: string | null
  created_at: string
}

const field = 'mt-1 w-full rounded-xl border border-[#e7e0e9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#6a4b7e]'
type Companion = Attendee & { id: string }

function getAttendeeState(row: Row) {
  const saved = row.attendees ?? []
  if (saved.length) {
    return {
      companions: saved.slice(1).map((person, index) => ({
        ...person,
        profile: normalizeAttendeeProfile(person.profile ?? (person.type === 'child' ? 'student' : 'guest')),
        id: `saved-${index}`,
      })),
    }
  }
  if (row.attendance !== 'yes') return { companions: [] as Companion[] }
  const leadType: Attendee['type'] = row.adults > 0 ? 'adult' : 'child'
  const missingAdults = Math.max(0, row.adults - (leadType === 'adult' ? 1 : 0))
  const missingChildren = Math.max(0, row.children - (leadType === 'child' ? 1 : 0))
  return {
    companions: Array.from({ length: Math.min(9, missingAdults + missingChildren) }, (_, index) => {
      const type = index < missingAdults ? 'adult' as const : 'child' as const
      return { id: `legacy-${index}`, name: 'Nom non renseigné', type, profile: type === 'child' ? 'student' as const : 'guest' as const }
    }),
  }
}

export function ResponseActions({ row, onDelete, onSaved, slots }: { row: Row; onDelete: () => void; onSaved: (row: Row) => void; slots: string[] }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState(row.full_name)
  const [phone, setPhone] = useState(row.phone ?? '')
  const [respondentType, setRespondentType] = useState<AttendeeProfile>(normalizeAttendeeProfile(row.respondent_type))
  const [attendance, setAttendance] = useState(row.attendance)
  const [arrivalSlot, setArrivalSlot] = useState(row.arrival_slot ?? '')
  const [comment, setComment] = useState(row.comment ?? '')
  const attendeeState = getAttendeeState(row)
  const [companions, setCompanions] = useState<Companion[]>(attendeeState.companions)

  function openEditor() {
    const state = getAttendeeState(row)
    setFullName(row.full_name)
    setPhone(row.phone ?? '')
    setRespondentType(normalizeAttendeeProfile(row.respondent_type))
    setAttendance(row.attendance)
    setArrivalSlot(row.arrival_slot ?? '')
    setComment(row.comment ?? '')
    setCompanions(state.companions)
    setError('')
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const attendees: Attendee[] = attendance === 'yes' ? [{ name: fullName.trim(), type: getLegacyAttendeeType(respondentType), profile: respondentType }, ...companions.map(({ name, type, profile }) => {
      const normalizedProfile = normalizeAttendeeProfile(profile ?? (type === 'child' ? 'student' : 'guest'))
      return { name: name.trim(), type: getLegacyAttendeeType(normalizedProfile), profile: normalizedProfile }
    })] : []
    const adults = attendees.filter(person => person.type === 'adult').length
    const data = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      respondent_type: respondentType,
      attendance,
      guests_total: attendees.length,
      adults,
      children: attendees.length - adults,
      attendees,
      arrival_slot: attendance === 'yes' ? arrivalSlot : null,
      comment: comment.trim() || null,
    }
    const response = await fetch(`/api/admin/responses/${row.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
    const result = await response.json()
    setBusy(false)
    if (!response.ok) {
      setError(result.error ?? 'Modification impossible.')
      return
    }
    onSaved({ ...row, ...data, phone: data.phone || null })
    setOpen(false)
  }

  return <>
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center"><button type="button" onClick={openEditor} aria-label={`Modifier la réponse de ${row.full_name}`} className="flex min-h-8 items-center gap-1.5 rounded-lg border border-[#e7e0e9] px-2.5 py-1.5 text-[11px] font-semibold text-[#655176] transition hover:bg-[#f3eef6]"><Pencil size={13}/> Modifier</button><button type="button" onClick={onDelete} aria-label={`Supprimer la réponse de ${row.full_name}`} className="flex min-h-8 items-center gap-1.5 rounded-lg border border-[#eee2e5] px-2.5 py-1.5 text-[11px] font-semibold text-[#a16a79] transition hover:bg-[#faeff1]"><Trash2 size={13}/> Supprimer</button></div>
    {open && <div role="presentation" onClick={event => { if (event.target === event.currentTarget) setOpen(false) }} className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#241c2b]/40 p-3 sm:p-4">
      <form role="dialog" aria-modal="true" aria-labelledby={`edit-title-${row.id}`} onSubmit={save} className="my-auto max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><h2 id={`edit-title-${row.id}`} className="text-lg font-semibold text-[#382746]">Modifier la réponse</h2><p className="mt-1 text-xs text-[#847b88]">Modifiez les coordonnées, le statut ou la liste des personnes.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-2 text-[#766e79] hover:bg-[#f4f0f6]"><X size={16}/></button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#514658]">Nom et prénom *<input required minLength={2} maxLength={120} value={fullName} onChange={event => setFullName(event.target.value)} className={field}/></label>
          <label className="text-xs font-semibold text-[#514658]">Numéro WhatsApp *<input required minLength={6} maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} className={field}/></label>
          <label className="text-xs font-semibold text-[#514658]">Vous êtes *<select value={respondentType} onChange={event => setRespondentType(event.target.value as AttendeeProfile)} className={field}>{attendeeProfiles.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-[#514658]">Présence *<select value={attendance} onChange={event => setAttendance(event.target.value as Row['attendance'])} className={field}><option value="yes">Confirmée</option><option value="no">Déclinée</option><option value="maybe">Incertaine</option></select></label>
        </div>
        {attendance === 'yes' && <div className="mt-4 rounded-xl bg-[#f9f7fa] p-3 sm:p-4"><h3 className="text-sm font-semibold text-[#473653]">Personnes présentes</h3>{!row.attendees?.length&&row.guests_total>1&&<p className="mt-2 rounded-lg bg-[#f7f1e4] p-3 text-xs leading-5 text-[#806b3f]">Cette ancienne réponse ne contient pas les noms des accompagnants. Remplacez « Nom non renseigné » pour enregistrer leurs noms.</p>}<AttendeeFields companions={companions} onCompanionsChange={setCompanions}/><label className="mt-4 block text-xs font-medium text-[#64596a]">Heure d’arrivée estimée *<select required value={arrivalSlot} onChange={event => setArrivalSlot(event.target.value)} className={field}><option value="">Choisir un créneau</option>{slots.map(slot=><option key={slot}>{slot}</option>)}</select></label></div>}
        <label className="mt-4 block text-xs font-semibold text-[#514658]">Commentaire<textarea maxLength={1000} rows={2} value={comment} onChange={event => setComment(event.target.value)} className={field}/></label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-xl border border-[#e7e0e9] px-4 text-sm font-semibold text-[#604a70]">Annuler</button><button disabled={busy} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#4b3260] px-4 text-sm font-semibold text-white disabled:opacity-60">{busy ? <LoaderCircle size={15} className="animate-spin"/> : <Save size={15}/>} Enregistrer</button></div>
      </form>
    </div>}
  </>
}
