import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, OPENAI_MODEL } from '@/lib/openai'
import { buildImproverPrompt } from '@/lib/prompts/essay-improver'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentEssay, instruction, wordLimit } = await req.json()

  try {
    const openai = getOpenAI()
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 2000,
      stream: true,
      messages: [{
        role: 'user',
        content: buildImproverPrompt(currentEssay, instruction, wordLimit),
      }],
    })

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(enc.encode(text))
          }
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Improvement failed'
          controller.enqueue(enc.encode(`\n\nERROR: ${msg}`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Essay improvement failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
