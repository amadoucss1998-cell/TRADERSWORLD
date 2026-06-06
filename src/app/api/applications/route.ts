import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json({ applications: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const now = new Date().toISOString()
  const newApp = {
    user_id: user.id,
    scholarship_id: body.scholarship_id,
    scholarship_title: body.scholarship_title,
    scholarship_provider: body.scholarship_provider || '',
    scholarship_description: body.scholarship_description || '',
    scholarship_url: body.scholarship_url || '',
    status: 'drafting',
    deadline: body.deadline || '',
    essay_prompt: body.essay_prompt || '',
    essay_draft: '',
    essay_version: 1,
    word_limit: body.word_limit || 650,
    notes: '',
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase.from('applications').insert(newApp).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ application: data })
}
