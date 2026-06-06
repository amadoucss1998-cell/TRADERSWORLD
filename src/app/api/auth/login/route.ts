import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const full_name = data.user.user_metadata?.full_name || email.split('@')[0]
  return Response.json({ user: { id: data.user.id, email: data.user.email, full_name } })
}
