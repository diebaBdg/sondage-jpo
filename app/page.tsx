import { RSVPForm } from '@/components/rsvp-form'
import { getEventSettings, getResponseForEdit } from '@/lib/data'
import { EventSettings } from '@/lib/event'
import { CalendarDays, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'

const rahmahLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ZeuYs6h8SCZRYhfoVkl0r1IMgwyfxm.png'

export default async function Home({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams
  const settings = await getEventSettings()
  const existing = edit ? await getResponseForEdit(edit) : null
  const isOpen = settings.survey_open !== false

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] text-[#292333]">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" aria-label="Rahmah, accueil" className="block shrink-0">
          <img src={rahmahLogo} alt="Rahmah" className="h-12 w-40 object-contain object-left sm:h-14 sm:w-52" />
        </Link>
        <Link href="/admin" className="rounded-full border border-[#e7e1e9] bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#584668] transition hover:border-[#6d5482] hover:bg-white sm:text-sm">
          Espace organisateur
        </Link>
      </header>

      <section className="relative isolate border-y border-[#eee9e2] bg-[#f2efe8]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 -z-10 size-[30rem] rounded-full border border-[#d9d1dc] sm:-right-12 sm:-top-64 sm:size-[42rem]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 -z-10 size-[22rem] rounded-full border border-[#e1dbe1] sm:-right-4 sm:-top-48 sm:size-[34rem]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dcd3e2] bg-white/70 px-3.5 py-2 text-[11px] font-bold tracking-[.13em] text-[#5a426d] sm:text-xs">
              <Sparkles size={14} aria-hidden="true" /> {settings.event_name || 'RAHMAH – 25 ans'}
            </p>
            <h1 className="max-w-2xl text-[2.7rem] font-semibold leading-[1.06] tracking-[-.045em] text-[#34263e] sm:text-6xl lg:text-7xl">
              La famille RAHMAH <span className="text-[#785e87]">se retrouve !</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#716976] sm:text-base sm:leading-7">
              {settings.intro_text || 'À l’occasion de nos 25 ans, nous préparons une Journée Portes Ouvertes exceptionnelle. Aidez-nous à mieux organiser votre accueil en répondant à ce court sondage.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:max-w-xs lg:justify-end">
            {settings.event_date && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-xs font-medium text-[#51465b]">
                <CalendarDays size={15} className="text-[#715982]" aria-hidden="true" />
                {new Date(`${settings.event_date}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
              </span>
            )}
            {settings.opening_hours && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-xs font-medium text-[#51465b]">
                <CalendarDays size={15} className="text-[#715982]" aria-hidden="true" /> {settings.opening_hours}
              </span>
            )}
            {settings.address && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-xs font-medium text-[#51465b]">
                <MapPin size={15} className="text-[#715982]" aria-hidden="true" /> {settings.address}
              </span>
            )}
          </div>
        </div>
      </section>

      <section id="inscription" className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-16 lg:py-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#907d98]">Votre invitation</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#392d43] sm:text-3xl">Quelques infos, et c’est noté.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#77717b]">Dites-nous si vous serez des nôtres, combien de personnes vous accompagneront et à quelle heure vous pensez arriver.</p>
          {settings.event_date && <p className="mt-4 text-xs font-semibold text-[#685276]">Journée Portes Ouvertes : {new Date(`${settings.event_date}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>}
        </aside>
        <div id="formulaire" className="min-w-0 scroll-mt-8">
          {isOpen || edit ? (
            <RSVPForm editToken={edit ?? ''} initial={existing} settings={settings} />
          ) : (
            <div className="rounded-[1.75rem] border border-[#e9e3ec] bg-white p-8 text-center shadow-[0_18px_55px_-35px_rgba(56,39,70,.3)] sm:p-12">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f3eef6] text-[#6d5482]"><CalendarDays size={24} /></span>
              <h2 className="mt-5 text-2xl font-semibold text-[#382746]">Le sondage est fermé</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#766e79]">Merci à toutes les personnes ayant déjà répondu. Pour toute question, contactez l’équipe organisatrice de la JPO RAHMAH.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#ebe6e9] px-5 py-6 text-center text-[11px] text-[#8e8791]">
        RAHMAH – 25 ans <span aria-hidden="true">·</span> JPO — Journée Portes Ouvertes
      </footer>
    </main>
  )
}
