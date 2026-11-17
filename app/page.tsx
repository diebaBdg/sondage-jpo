import { RSVPForm } from '@/components/rsvp-form'
import { getEventSettings, getResponseForEdit } from '@/lib/data'
import { ArrowDown, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'

const rahmahLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ZeuYs6h8SCZRYhfoVkl0r1IMgwyfxm.png'

export default async function Home({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams
  const settings = await getEventSettings()
  const existing = edit ? await getResponseForEdit(edit) : null

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
              <Sparkles size={14} aria-hidden="true" /> JOURNÉE PORTES OUVERTES
            </p>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[#82758a]">École Rahmah · Rahmah Alumni</p>
            <h1 className="max-w-2xl text-[2.7rem] font-semibold leading-[1.06] tracking-[-.045em] text-[#34263e] sm:text-6xl lg:text-7xl">
              Le plaisir de se retrouver <span className="text-[#785e87]">commence ici.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#716976] sm:text-base sm:leading-7">
              Nous serons heureux de vous accueillir à la JPO Rahmah. Confirmez votre venue en quelques instants.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:max-w-xs lg:justify-end">
            {settings.event_date && <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-xs font-medium text-[#51465b]"><CalendarDays size={15} className="text-[#715982]" aria-hidden="true" />{settings.event_date}</span>}
            {settings.address && <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-xs font-medium text-[#51465b]"><MapPin size={15} className="text-[#715982]" aria-hidden="true" />{settings.address}</span>}
          </div>
        </div>
      </section>

      <section id="inscription" className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-16 lg:py-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#907d98]">Votre invitation</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#392d43] sm:text-3xl">Quelques infos, et c&apos;est noté.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#77717b]">Dites-nous si vous serez des nôtres et combien de personnes vous accompagneront.</p>
          <a href="#formulaire" className="mt-6 hidden items-center gap-2 text-xs font-semibold text-[#685276] hover:text-[#3f2e4b] lg:inline-flex">Remplir le formulaire <ArrowDown size={14} aria-hidden="true" /></a>
          <div className="mt-7 hidden rounded-2xl border border-[#ebe6e9] bg-white/75 p-4 text-xs leading-5 text-[#77717b] lg:block">
            <p className="font-semibold text-[#50445a]">Un changement de programme ?</p>
            <p className="mt-1">Vous pourrez modifier votre réponse grâce au lien sécurisé envoyé après validation.</p>
          </div>
        </aside>
        <div id="formulaire" className="min-w-0 scroll-mt-8">
          <RSVPForm editToken={edit ?? ''} initial={existing} />
        </div>
      </section>

      <footer className="border-t border-[#ebe6e9] px-5 py-6 text-center text-[11px] text-[#8e8791]">
        École Rahmah & Rahmah Alumni <span aria-hidden="true">·</span> JPO — Journée portes ouvertes
      </footer>
    </main>
  )
}
