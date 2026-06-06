import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: Record<string, string> | null = null
  try { body = await req.json() } catch { /* invalid json */ }
  if (!body) return Response.json({ error: 'Invalid request.' }, { status: 400 })

  const { email, password, full_name } = body

  if (!email || !password || !full_name) {
    return Response.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true,
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
        return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return Response.json({ error: error.message }, { status: 400 })
    }

    if (!data?.user) {
      return Response.json({ error: 'User creation returned no data. Check Supabase service role key.' }, { status: 500 })
    }

    // Sign in to set session cookie
    try {
      const supabase = await createClient()
      await supabase.auth.signInWithPassword({ email, password })
    } catch {
      // Session cookie failed but account was created — user can log in manually
    }

    return Response.json({ user: { id: data.user.id, email, full_name } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Register error:', msg)
    return Response.json({ error: msg || 'Registration failed. Please try again.' }, { status: 500 })
  }
}
