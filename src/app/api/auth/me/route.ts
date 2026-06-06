import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ user: null }, { status: 401 })
  const full_name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
  return Response.json({ user: { id: user.id, email: user.email, full_name } })
}
