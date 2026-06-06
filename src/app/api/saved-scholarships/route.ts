import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'

const memScholarships = new Map<string, unknown>()
const memSaved = new Map<string, Set<string>>()

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
        .from('saved_scholarships')
        .select('*, scholarships(*)')
        .eq('user_id', session.userId)
      const scholarships = (data || []).map((row: Record<string, unknown>) => row.scholarships)
      return Response.json({ scholarships })
    } catch {
      // fall through
    }
  }

  const savedIds = memSaved.get(session.userId) || new Set<string>()
  const scholarships = Array.from(savedIds)
    .map(id => memScholarships.get(id))
    .filter(Boolean)
  return Response.json({ scholarships })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarship } = await req.json()
  if (!scholarship?.id) return Response.json({ error: 'Missing scholarship' }, { status: 400 })

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.from('scholarships').upsert(scholarship, { onConflict: 'id' })
      await supabase.from('saved_scholarships').upsert(
        { user_id: session.userId, scholarship_id: scholarship.id },
        { onConflict: 'user_id,scholarship_id' }
      )
      return Response.json({ ok: true })
    } catch {
      // fall through
    }
  }

  memScholarships.set(scholarship.id, scholarship)
  if (!memSaved.has(session.userId)) memSaved.set(session.userId, new Set())
  memSaved.get(session.userId)!.add(scholarship.id)
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarshipId } = await req.json()

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase
        .from('saved_scholarships')
        .delete()
        .eq('user_id', session.userId)
        .eq('scholarship_id', scholarshipId)
      return Response.json({ ok: true })
    } catch {
      // fall through
    }
  }

  memSaved.get(session.userId)?.delete(scholarshipId)
  return Response.json({ ok: true })
}
