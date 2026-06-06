import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: Record<string, string> | null = null
  try { body = await req.json() } catch { /* invalid json */ }
  if (!body) return Response.json({ error: 'Invalid request.' }, { status: 400 })

  const { email, password } = body

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const full_name = data.user.user_metadata?.full_name || email.split('@')[0]
    return Response.json({ user: { id: data.user.id, email: data.user.email, full_name } })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
