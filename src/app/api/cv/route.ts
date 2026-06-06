import { createClient } from '@/lib/supabase/server'
import { getOpenAI, OPENAI_MODEL } from '@/lib/openai'
import { buildCVPrompt } from '@/lib/prompts/cv-generator'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { profile, target_field } = await req.json()
  const prompt = buildCVPrompt(profile, target_field || 'scholarship')

  try {
    const openai = getOpenAI()
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 2000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'CV generation failed'
          controller.enqueue(encoder.encode(`\n\nERROR: ${msg}`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'CV generation failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
