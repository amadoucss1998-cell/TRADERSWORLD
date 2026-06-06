import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'

// Shared in-memory store — in production use Supabase
const memApplications = new Map<string, unknown[]>()

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('https://') && !url.includes('placeholder')
}

function findApp(userId: string, id: string) {
  const apps = (memApplications.get(userId) || []) as Record<string, unknown>[]
  return apps.find(a => a.id === id) || null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('applications')
        .select('*, scholarships(*)')
        .eq('id', id)
        .eq('user_id', session.userId)
        .single()
      if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
      return Response.json({ application: data })
    } catch {
      // fall through
    }
  }

  const app = findApp(session.userId, id)
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ application: app })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('applications')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.userId)
        .select()
        .single()
      return Response.json({ application: data })
    } catch {
      // fall through
    }
  }

  const apps = (memApplications.get(session.userId) || []) as Record<string, unknown>[]
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  apps[idx] = { ...apps[idx], ...body, updated_at: new Date().toISOString() }
  memApplications.set(session.userId, apps)
  return Response.json({ application: apps[idx] })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.from('applications').delete().eq('id', id).eq('user_id', session.userId)
      return Response.json({ ok: true })
    } catch {
      // fall through
    }
  }

  const apps = (memApplications.get(session.userId) || []) as Record<string, unknown>[]
  memApplications.set(session.userId, apps.filter((a: Record<string, unknown>) => a.id !== id))
  return Response.json({ ok: true })
}
