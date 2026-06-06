import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { memProfiles } from '@/lib/mem-store'

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('https://') && !url.includes('placeholder')
}

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.userId)
        .single()
      return Response.json({ profile: data || null })
    } catch {
      // fall through to in-memory
    }
  }

  return Response.json({ profile: memProfiles.get(session.userId) || null })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.from('profiles').upsert({ ...body, user_id: session.userId })
      return Response.json({ ok: true })
    } catch {
      // fall through to in-memory
    }
  }

  memProfiles.set(session.userId, body)
  return Response.json({ ok: true })
}
