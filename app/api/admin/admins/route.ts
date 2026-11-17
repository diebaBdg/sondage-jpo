import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOwnerAdmin } from '@/lib/admin-auth'
import { getAdminDb } from '@/lib/data'

const emailSchema = z.object({ email: z.string().trim().email().max(254).transform(value => value.toLowerCase()) })

export async function POST(request: Request) {
  if (!await requireOwnerAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = emailSchema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })

  const { data, error } = await getAdminDb()
    .from('gpo_admins')
    .insert({ email: body.data.email, is_owner: false })
    .select('email,is_owner,created_at')
    .single()

  if (error?.code === '23505') return NextResponse.json({ error: 'Cette adresse est déjà administratrice.' }, { status: 409 })
  if (error || !data) return NextResponse.json({ error: 'Impossible d’ajouter cet administrateur.' }, { status: 500 })
  return NextResponse.json({ admin: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!await requireOwnerAdmin()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = emailSchema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })

  const { data, error } = await getAdminDb()
    .from('gpo_admins')
    .delete()
    .eq('email', body.data.email)
    .eq('is_owner', false)
    .select('email')
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Impossible de retirer cet administrateur.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Administrateur introuvable ou protégé.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
