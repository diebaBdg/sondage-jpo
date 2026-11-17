'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LoaderCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setBusy(true)
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      setError('Le lien de vérification est invalide ou expiré. Demandez une nouvelle invitation.')
      setBusy(false)
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { ...user.user_metadata, password_setup_required: false },
    })
    if (updateError) {
      setError('Impossible d’enregistrer ce mot de passe. Vérifiez qu’il contient au moins 12 caractères.')
      setBusy(false)
      return
    }
    router.replace('/admin/dashboard')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f6f1] px-5 py-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#e9e3ec] bg-white p-6 shadow-xl shadow-[#382746]/5 sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#432b58] text-white"><Sparkles size={20} /></span>
          <span className="text-xs font-extrabold tracking-[.18em] text-[#432b58]">RAHMAH ALUMNI</span>
        </div>
        <div className="mt-5 grid size-12 place-items-center rounded-2xl bg-[#f3eef6] text-[#634976]" aria-hidden="true"><KeyRound size={21} /></div>
        <h1 className="mt-4 text-2xl font-semibold text-[#382746]">Créer votre mot de passe</h1>
        <p className="mt-2 text-sm leading-6 text-[#766e79]">Adresse vérifiée. Choisissez un mot de passe unique de 12 caractères minimum.</p>
        <label className="mt-4 block text-xs font-semibold text-[#514658]">
          Nouveau mot de passe
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required className="mt-2 w-full rounded-xl border border-[#e7e0e9] px-4 py-3 text-sm outline-none focus:border-[#6a4b7e]" />
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#514658]">
          Confirmer le mot de passe
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type="password" autoComplete="new-password" minLength={12} required className="mt-2 w-full rounded-xl border border-[#e7e0e9] px-4 py-3 text-sm outline-none focus:border-[#6a4b7e]" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#432b58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#352046] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a4b7e] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
          {busy && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </main>
  )
}
