'use client'

import { FormEvent, useState } from 'react'
import { LoaderCircle, ShieldCheck, Trash2, UserPlus } from 'lucide-react'

type AdminAccount = { email: string; is_owner: boolean; created_at: string }

export function AdminManagement({ initialAdmins }: { initialAdmins: AdminAccount[] }) {
  const [admins, setAdmins] = useState(initialAdmins)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState('')
  const [notice, setNotice] = useState('')

  async function addAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    const response = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const result = await response.json()
    setBusy(false)
    if (!response.ok) {
      setNotice(result.error ?? 'Impossible d’ajouter cet administrateur.')
      return
    }
    setAdmins(current => [...current, result.admin])
    setEmail('')
    setNotice(result.invite_sent === false
      ? 'Administrateur ajouté, mais l’e-mail d’invitation n’a pas pu partir. Créez le compte dans le tableau Supabase.'
      : 'Administrateur ajouté. Un e-mail d’invitation vient de partir pour qu’il choisisse son mot de passe.')
  }

  async function removeAdmin(admin: AdminAccount) {
    if (!window.confirm(`Retirer les droits administrateur de ${admin.email} ?`)) return
    setRemoving(admin.email)
    setNotice('')
    const response = await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: admin.email }),
    })
    const result = await response.json()
    setRemoving('')
    if (!response.ok) {
      setNotice(result.error ?? 'Impossible de retirer cet administrateur.')
      return
    }
    setAdmins(current => current.filter(item => item.email !== admin.email))
    setNotice('Accès administrateur retiré.')
  }

  return (
    <section className="mb-5 rounded-2xl border border-[#e9e3ec] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2eef5] text-[#644c75]"><ShieldCheck size={18} /></span>
        <div>
          <h2 className="font-semibold text-[#493653]">Accès administrateurs</h2>
          <p className="mt-1 text-xs leading-5 text-[#847b88]">Ajoutez les adresses autorisées à consulter les réponses et à gérer l’événement. Le compte de connexion doit utiliser la même adresse.</p>
        </div>
      </div>
      <form onSubmit={addAdmin} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="new-admin-email">Adresse e-mail du nouvel administrateur</label>
        <input id="new-admin-email" type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="nom@exemple.com" className="min-w-0 flex-1 rounded-xl border border-[#e7e0e9] px-3 py-3 text-sm outline-none focus:border-[#6a4b7e]" />
        <button type="submit" disabled={busy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4b3260] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Ajouter l’accès
        </button>
      </form>
      {notice && <p role="status" className="mt-3 rounded-lg bg-[#f7f4f8] px-3 py-2 text-xs leading-5 text-[#604a70]">{notice}</p>}
      <ul className="mt-4 divide-y divide-[#f0edf1] rounded-xl border border-[#eee9f0]">
        {admins.map(admin => (
          <li key={admin.email} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-all text-sm font-medium text-[#493653]">{admin.email}</p>
              <p className="mt-1 text-xs text-[#928996]">{admin.is_owner ? 'Propriétaire · accès permanent' : `Ajouté le ${new Date(admin.created_at).toLocaleDateString('fr-FR')}`}</p>
            </div>
            {!admin.is_owner && <button type="button" disabled={removing === admin.email} onClick={() => removeAdmin(admin)} className="flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#e9e3ec] px-3 text-xs font-semibold text-[#725c7f] disabled:opacity-60 sm:self-auto"><Trash2 size={14} />{removing === admin.email ? 'Retrait…' : 'Retirer'}</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
