import { RSVPForm } from '@/components/rsvp-form'
import { getEventSettings, getResponseForEdit } from '@/lib/data'
import { CalendarDays, MapPin } from 'lucide-react'
import Link from 'next/link'

export default async function Home({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams
  const settings = await getEventSettings()
  let existing: Record<string, unknown> | null = null
  if (edit) {
    existing = await getResponseForEdit(edit)
  }
  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#292235]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 sm:gap-3" aria-label="Rahmah Alumni, accueil">
          <img src="/icon.svg" alt="Logo de l’école Rahmah" className="size-12 shrink-0 rounded-xl object-contain sm:size-14"/>
          <span className="leading-tight"><span className="block text-sm font-extrabold tracking-[.16em]">RAHMAH</span><span className="text-[10px] font-semibold tracking-[.24em] text-[#806c8d]">ALUMNI</span></span>
        </Link>
        <Link href="/admin" className="rounded-full border border-[#e7e0e9] px-3 py-2 text-[11px] font-semibold text-[#665477] sm:px-4 sm:text-xs transition hover:bg-white">Espace organisateur</Link>
      </header>
      <section className="relative overflow-hidden bg-[#432b58] text-white">
        <div className="absolute -right-20 -top-32 size-96 rounded-full border border-white/10"/><div className="absolute -right-3 -top-16 size-64 rounded-full border border-white/10"/>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#d4f6f1]"><span className="size-1.5 rounded-full bg-[#72d4c8]"/> JPO · JOURNÉE PORTES OUVERTES</span><p className="mb-3 text-sm font-medium tracking-[.2em] text-[#c5b6d1]">ÉCOLE RAHMAH & RAHMAH ALUMNI</p><h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">Votre présence à la <span className="text-[#79d8cc]">JPO RAHMAH</span></h1></div>
          <div className="flex flex-wrap gap-3 text-xs text-white/80">{settings.event_date && <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><CalendarDays size={15}/>{settings.event_date}</span>}{settings.address && <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><MapPin size={15}/>{settings.address}</span>}</div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-16 lg:py-16">
        <aside className="pt-2"><h2 className="text-2xl font-semibold leading-snug text-[#382746]">Informations du participant</h2></aside>
        <RSVPForm editToken={edit ?? ''} initial={existing} />
      </section>
      <footer className="border-t border-[#e9e3ec] px-5 py-6 text-center text-xs text-[#958c98]">© ÉCOLE RAHMAH & RAHMAH ALUMNI · JPO — Journée portes ouvertes</footer>
    </main>
  )
}
