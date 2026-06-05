import { NextRequest } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { buildEssayPrompt } from '@/lib/prompts/essay-writer'
import type { Profile } from '@/types/profile'

export async function POST(req: NextRequest) {
  const { profile, scholarshipName, provider, scholarshipDescription, essayPrompt, wordLimit } = await req.json()

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: buildEssayPrompt(profile as Profile, scholarshipName, provider, scholarshipDescription, essayPrompt, wordLimit),
    }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
