import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { allowed, remaining, resetIn } = checkRateLimit(`demo-essay:${ip}`)

  if (!allowed) {
    const minutes = Math.ceil(resetIn / 60000)
    return Response.json(
      { error: `Rate limit reached. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
      { status: 429 }
    )
  }

  const { profile, scholarship } = await req.json().catch(() => ({ profile: {}, scholarship: {} }))

  const prompt = `You are an expert scholarship essay writer helping a student from Liberia apply for the ${scholarship.title} offered by ${scholarship.provider}.

Student Profile:
- Name: ${profile.full_name || 'A Liberian student'}
- Field of Study: ${profile.field_of_study || 'Computer Science'}
- Degree Level: ${profile.degree_level || 'masters'}
- GPA: ${profile.gpa || '3.7'}
- Nationality: Liberian

Scholarship: ${scholarship.title}
Provider: ${scholarship.provider}
Description: ${scholarship.description}

Essay Prompt: "Why do you deserve this scholarship and how will it help you achieve your goals?"
Word Limit: 350 words

Write a compelling, authentic scholarship essay that:
1. Opens with a powerful hook rooted in the student's Liberian background
2. Connects their academic journey to the scholarship's mission
3. Describes specific goals and how this scholarship enables them
4. Ends with a memorable statement about future impact on Liberia
5. Stays within 350 words
6. Sounds authentic, not AI-generated

Write only the essay — no title, no "Here is your essay:", just the essay text.`

  try {
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
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
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Demo-Remaining': String(remaining),
      },
    })
  } catch {
    // Fallback essay if API key not configured
    const fallback = `Growing up in Monrovia, Liberia, I watched my community struggle with challenges that education could solve. That conviction — that knowledge is the most powerful tool for change — has driven every step of my academic journey.

As a ${profile.degree_level || 'graduate'} student in ${profile.field_of_study || 'my field'} with a ${profile.gpa || '3.7'} GPA, I have consistently pushed beyond academic requirements to apply my learning to real problems. My research project on [specific project] demonstrated that even with limited resources, innovative thinking can produce meaningful outcomes.

The ${scholarship.title} represents more than financial support — it is an opportunity to access world-class training that simply does not exist at the scale I need in Liberia. The ${scholarship.provider}'s commitment to developing leaders from underrepresented regions aligns perfectly with my goal: to return home with the expertise to build institutions that last.

In five years, I envision leading a team that brings [specific impact] to communities across West Africa. This scholarship would accelerate that timeline by years. I am not asking for a gift — I am asking for the chance to prove that students from Liberia can compete and lead on the world stage.

With your support, I will.`

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        // Stream in small chunks to feel fast and natural (~1.5s total)
        const chunks = fallback.match(/.{1,40}/g) ?? []
        let i = 0
        const interval = setInterval(() => {
          if (i < chunks.length) {
            controller.enqueue(encoder.encode(chunks[i]))
            i++
          } else {
            clearInterval(interval)
            controller.close()
          }
        }, 15)
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
