import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminDb } from '@/lib/data'
const schema=z.object({event_date:z.string().max(10).nullable(),address:z.string().max(250).nullable()})
export async function PATCH(request:Request){if(!await requireAdmin())return NextResponse.json({error:'Non autorisé'},{status:401});const body=schema.safeParse(await request.json());if(!body.success)return NextResponse.json({error:'Configuration invalide'},{status:400});const {error}=await getAdminDb().from('gpo_settings').upsert({id:1,...body.data,updated_at:new Date().toISOString()});return error?NextResponse.json({error:'Enregistrement impossible'},{status:500}):NextResponse.json({ok:true})}
