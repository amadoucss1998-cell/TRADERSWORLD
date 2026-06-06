import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { memApplications } from '@/lib/mem-store'

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
        .from('applications')
        .select('*, scholarships(*)')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
      return Response.json({ applications: data || [] })
    } catch {
      // fall through
    }
  }

  return Response.json({ applications: memApplications.get(session.userId) || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const now = new Date().toISOString()
  const newApp = {
    id: crypto.randomUUID(),
    user_id: session.userId,
    scholarship_id: body.scholarship_id,
    scholarship_title: body.scholarship_title,
    status: 'drafting',
    deadline: body.deadline || '',
    essay_prompt: body.essay_prompt || '',
    essay_draft: '',
    essay_version: 1,
    word_limit: body.word_limit || 650,
    notes: '',
    documents: [],
    created_at: now,
    updated_at: now,
  }

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase.from('applications').insert(newApp).select().single()
      return Response.json({ application: data })
    } catch {
      // fall through
    }
  }

  const apps = memApplications.get(session.userId) || []
  apps.unshift(newApp)
  memApplications.set(session.userId, apps)
  return Response.json({ application: newApp })
}
