'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LoaderCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('dienabafilybodiang@gmail.com')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resetNotice, setResetNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Connexion impossible. Vérifiez votre adresse e-mail et votre mot de passe.')
      setBusy(false)
      return
    }
    router.push('/admin/dashboard')
    router.refresh()
  }

  async function requestPasswordReset() {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Saisissez votre adresse e-mail.')
      return
    }

    setBusy(true)
    setError('')
    setResetNotice('')

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', '/auth/set-password')
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: callbackUrl.toString() },
      )
      if (resetError) {
        setError(resetError.status === 429 || resetError.code === 'over_email_send_rate_limit'
          ? 'Trop de demandes. Réessayez plus tard.'
          : 'Impossible d’envoyer le lien de réinitialisation. Réessayez plus tard.')
        return
      }
      setResetNotice('Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.')
    } catch {
      setError('Impossible d’envoyer le lien de réinitialisation. Réessayez plus tard.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f6f1] px-5 py-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#e9e3ec] bg-white p-5 shadow-xl shadow-[#382746]/5 sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#432b58] text-white"><Sparkles size={20} /></span>
          <span className="text-xs font-extrabold tracking-[.18em] text-[#432b58]">RAHMAH ALUMNI</span>
        </div>
        <div className="mt-6 grid size-12 place-items-center rounded-2xl bg-[#f3eef6] text-[#634976]" aria-hidden="true"><KeyRound size={21} /></div>
        <h1 className="mt-5 text-2xl font-semibold text-[#382746]">Espace organisateur</h1>
        <p className="mt-2 text-sm leading-6 text-[#766e79]">Connectez-vous avec votre adresse e-mail et votre mot de passe administrateur.</p>
        <label className="mt-4 block text-xs font-semibold text-[#514658]">
          Adresse e-mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded-xl border border-[#e7e0e9] px-4 py-3 text-sm outline-none focus:border-[#6a4b7e]" />
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#514658]">
          Mot de passe
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-[#e7e0e9] px-4 py-3 text-sm outline-none focus:border-[#6a4b7e]" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#432b58] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#352046] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a4b7e] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
          {busy && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
        <button type="button" onClick={requestPasswordReset} disabled={busy} className="mt-3 w-full text-center text-sm font-semibold text-[#644c75] underline underline-offset-4 disabled:opacity-60">Mot de passe oublié ?</button>
        {resetNotice && <p role="status" className="mt-3 text-center text-sm leading-5 text-[#604a70]">{resetNotice}</p>}
        <p className="mt-4 text-center text-xs leading-5 text-[#766e79]">L’accès reste réservé aux administrateurs autorisés.</p>
      </form>
    </main>
  )
}
