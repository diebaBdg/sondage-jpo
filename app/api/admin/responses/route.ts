import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminDb } from '@/lib/data'

const slots = ['09h–10h','10h–11h','11h–12h','12h–13h','13h–14h','14h–15h','15h–16h','16h–17h'] as const
const attendeeSchema = z.object({ name: z.string().trim().min(2).max(120), type: z.enum(['adult','child']) })
const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  respondent_type: z.enum(['parent','alumni','student','family','friend','guest','other']),
  attendance: z.enum(['yes','no','maybe']),
  guests_total: z.number().int().min(0).max(10),
  adults: z.number().int().min(0).max(10),
  children: z.number().int().min(0).max(10),
  attendees: z.array(attendeeSchema).max(10),
  arrival_slot: z.enum(slots).nullable(),
  comment: z.string().max(1000).nullable(),
  consent: z.literal(true),
})

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Vérifiez les champs obligatoires.' }, { status: 400 })
  const value = parsed.data
  const adults = value.attendees.filter(person => person.type === 'adult').length
  const valid = value.attendance === 'yes'
    ? value.attendees.length >= 1 && value.attendees[0].name === value.full_name && value.guests_total === value.attendees.length && value.adults === adults && value.children === value.attendees.length - adults && Boolean(value.arrival_slot)
    : value.guests_total === 0 && value.adults === 0 && value.children === 0 && value.attendees.length === 0 && value.arrival_slot === null
  if (!valid) return NextResponse.json({ error: 'Vérifiez les personnes présentes et le créneau horaire.' }, { status: 400 })

  const token = randomBytes(32).toString('hex')
  const { data, error } = await getAdminDb().from('gpo_responses').insert({
    full_name: value.full_name,
    phone: value.phone && value.phone.length >= 6 ? value.phone : null,
    respondent_type: value.respondent_type,
    attendance: value.attendance,
    guests_total: value.guests_total,
    adults: value.adults,
    children: value.children,
    attendees: value.attendees,
    arrival_slot: value.arrival_slot,
    comment: value.comment || null,
    consent_at: new Date().toISOString(),
    edit_token_hash: createHash('sha256').update(token).digest('hex'),
  }).select('id,full_name,phone,respondent_type,attendance,guests_total,adults,children,attendees,arrival_slot,comment,created_at').single()

  if (error?.code === '23505') return NextResponse.json({ error: 'Une réponse existe déjà avec ce numéro de téléphone.' }, { status: 409 })
  if (error || !data) return NextResponse.json({ error: 'Impossible d’enregistrer cette réponse.' }, { status: 500 })
  return NextResponse.json({ response: data }, { status: 201 })
}
