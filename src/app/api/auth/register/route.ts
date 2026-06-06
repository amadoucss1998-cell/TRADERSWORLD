import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, full_name } = await req.json().catch(() => ({}))

  if (!email || !password || !full_name) {
    return Response.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: existing } = await admin.auth.admin.listUsers()
  if (existing?.users?.some(u => u.email === email)) {
    return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true,
  })

  if (error || !data.user) {
    return Response.json({ error: error?.message || 'Registration failed.' }, { status: 400 })
  }

  // Sign in immediately so the session cookie gets set
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return Response.json({ error: 'Account created but sign-in failed. Please log in.' }, { status: 500 })
  }

  return Response.json({ user: { id: data.user.id, email, full_name } })
}
