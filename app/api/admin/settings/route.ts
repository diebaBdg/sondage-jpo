import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminDb } from '@/lib/data'

const schema = z.object({
  event_name: z.string().trim().max(120).nullable(),
  event_date: z.string().max(10).nullable(),
  opening_hours: z.string().trim().max(120).nullable(),
  address: z.string().trim().max(250).nullable(),
  intro_text: z.string().trim().max(500).nullable(),
  confirmation_message: z.string().trim().max(300).nullable(),
  survey_open: z.boolean(),
  arrival_slots: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
})

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'Configuration invalide' }, { status: 400 })
  const { error } = await getAdminDb().from('gpo_settings').upsert({ id: 1, ...body.data, updated_at: new Date().toISOString() })
  return error ? NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 }) : NextResponse.json({ ok: true })
}
