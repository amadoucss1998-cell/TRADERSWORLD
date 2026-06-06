import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('saved_scholarships')
    .select('scholarship_data')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const scholarships = (data || []).map(r => r.scholarship_data)
  return Response.json({ scholarships })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarship } = await req.json()
  await supabase.from('saved_scholarships').upsert({
    user_id: user.id,
    scholarship_id: scholarship.id,
    scholarship_data: scholarship,
    saved_at: new Date().toISOString(),
  })
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarshipId } = await req.json()
  await supabase.from('saved_scholarships').delete().eq('user_id', user.id).eq('scholarship_id', scholarshipId)
  return Response.json({ ok: true })
}
