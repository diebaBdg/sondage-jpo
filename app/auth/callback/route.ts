import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const isPasswordRecovery = url.searchParams.get('type') === 'recovery'
        || url.searchParams.get('next') === '/auth/set-password'
      const destination = isPasswordRecovery || user?.user_metadata?.password_setup_required === true
        ? '/auth/set-password'
        : '/admin/dashboard'
      return NextResponse.redirect(new URL(destination, url.origin))
    }
  }
  return NextResponse.redirect(new URL('/admin', url.origin))
}
