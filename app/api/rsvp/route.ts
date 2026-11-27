import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getAdminDb } from '@/lib/data'
import { normalizeArrivalSlots } from '@/lib/event'

const attendeeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['adult', 'child']),
  profile: z.enum(['parent', 'alumni', 'student', 'staff', 'family', 'friend', 'guest', 'other']).optional(),
})

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(6).max(30),
  respondent_type: z.enum(['parent', 'alumni', 'student', 'staff', 'family', 'friend', 'guest', 'other']),
  attendance: z.enum(['yes', 'no', 'maybe']),
  guests_total: z.coerce.number().int().min(0).max(10),
  adults: z.coerce.number().int().min(0).max(10),
  children: z.coerce.number().int().min(0).max(10),
  attendees: z.array(attendeeSchema).max(10).default([]),
  arrival_slot: z.string().max(40).nullable().optional(),
  comment: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
  editToken: z.string().max(150).optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Vérifiez les champs obligatoires et réessayez.' }, { status: 400 })
    const v = parsed.data

    const db = getAdminDb()
    const { data: settings } = await db.from('gpo_settings').select('survey_open,arrival_slots').eq('id', 1).maybeSingle()
    if (settings && settings.survey_open === false) {
      return NextResponse.json({ error: 'Le sondage est fermé pour le moment.' }, { status: 403 })
    }
    const validSlots = new Set(normalizeArrivalSlots(settings?.arrival_slots))

    const adults = v.attendees.filter(person => person.type === 'adult').length
    const validAttendance = v.attendance === 'yes'
      ? v.attendees.length >= 1 && v.attendees[0].name === v.full_name && v.guests_total === v.attendees.length && v.adults === adults && v.children === v.attendees.length - adults && Boolean(v.arrival_slot && validSlots.has(v.arrival_slot))
      : v.guests_total === 0 && v.adults === 0 && v.children === 0 && v.attendees.length === 0 && !v.arrival_slot
    if (!validAttendance) return NextResponse.json({ error: 'Vérifiez les personnes présentes, leur catégorie et le créneau horaire.' }, { status: 400 })

    const payload = {
      full_name: v.full_name,
      phone: v.whatsapp,
      respondent_type: v.respondent_type,
      attendance: v.attendance,
      guests_total: v.attendance === 'yes' ? v.guests_total : 0,
      adults: v.attendance === 'yes' ? v.adults : 0,
      children: v.attendance === 'yes' ? v.children : 0,
      attendees: v.attendance === 'yes' ? v.attendees : [],
      arrival_slot: v.attendance === 'yes' ? v.arrival_slot : null,
      comment: v.comment || null,
      consent_at: new Date().toISOString(),
    }

    if (v.editToken) {
      if (!/^[a-f0-9]{64}$/.test(v.editToken)) return NextResponse.json({ error: 'Lien de modification invalide.' }, { status: 403 })
      const { data, error } = await db.from('gpo_responses').update(payload).eq('edit_token_hash', createHash('sha256').update(v.editToken).digest('hex')).select('id').maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Lien expiré ou invalide. Une nouvelle réponse peut être envoyée.' }, { status: 403 })
      return NextResponse.json({ ok: true, editUrl: `/?edit=${v.editToken}` })
    }

    const token = randomBytes(32).toString('hex')
    const { error } = await db.from('gpo_responses').insert({ ...payload, edit_token_hash: hash(token) })
    if (error?.code === '23505') return NextResponse.json({ error: 'Une réponse existe déjà avec ce numéro WhatsApp. Utilisez votre lien de modification.' }, { status: 409 })
    if (error) throw error
    return NextResponse.json({ ok: true, editUrl: `/?edit=${token}` })
  } catch {
    return NextResponse.json({ error: 'Le service est momentanément indisponible. Réessayez dans quelques instants.' }, { status: 503 })
  }
}

function hash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
