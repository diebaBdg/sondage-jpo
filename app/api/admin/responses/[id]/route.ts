import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminDb } from '@/lib/data'

const slots = ['09h–10h','10h–11h','11h–12h','12h–13h','13h–14h','14h–15h','15h–16h','16h–17h'] as const
const attendeeSchema = z.object({ name: z.string().trim().min(2).max(120), type: z.enum(['adult','child']) })
const patchSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  respondent_type: z.enum(['parent','alumni','student','family','friend','guest','other']),
  attendance: z.enum(['yes','no','maybe']),
  guests_total: z.number().int().min(0).max(10),
  adults: z.number().int().min(0).max(10),
  children: z.number().int().min(0).max(10),
  attendees: z.array(attendeeSchema).max(10),
  arrival_slot: z.enum(slots).nullable(),
  comment: z.string().max(1000).nullable(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Réponse invalide' }, { status: 400 })
  const value = parsed.data
  const adults = value.attendees.filter(person => person.type === 'adult').length
  const valid = value.attendance === 'yes'
    ? value.attendees.length >= 1 && value.attendees[0].name === value.full_name && value.guests_total === value.attendees.length && value.adults === adults && value.children === value.attendees.length - adults && Boolean(value.arrival_slot)
    : value.guests_total === 0 && value.adults === 0 && value.children === 0 && value.attendees.length === 0 && value.arrival_slot === null
  if (!valid) return NextResponse.json({ error: 'Vérifiez les personnes présentes et le créneau.' }, { status: 400 })
  const { error } = await getAdminDb().from('gpo_responses').update(value).eq('id', id)
  return error ? NextResponse.json({ error: 'Modification impossible' }, { status: 500 }) : NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  const { error } = await getAdminDb().from('gpo_responses').delete().eq('id', id)
  return error ? NextResponse.json({ error: 'Suppression impossible' }, { status: 500 }) : NextResponse.json({ ok: true })
}
