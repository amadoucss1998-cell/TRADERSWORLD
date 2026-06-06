import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, OPENAI_MODEL } from '@/lib/openai'

const PROMPTS = {
  cover_letter: (profile: Record<string, string>, scholarship: Record<string, string>) => `
Write a formal cover letter for a scholarship application.

Student: ${profile.full_name}, from Liberia
Field: ${profile.field_of_study}, ${profile.degree_level} level, GPA ${profile.gpa}
Institution: ${profile.current_institution}
Achievements: ${profile.achievements}

Scholarship: ${scholarship.title}
Provider: ${scholarship.provider}
Description: ${scholarship.description}

Write a professional, concise cover letter (250 words max) addressed to the scholarship committee. Include:
- Formal salutation
- Why they are applying
- Why they are a strong candidate
- How the scholarship aligns with their goals
- Professional closing

IMPORTANT: Output plain text only. No markdown, no HTML tags, no asterisks, no special formatting symbols. Write it as a real letter with proper paragraph breaks using blank lines.

Write only the letter — no preamble, no commentary.`,

  personal_statement: (profile: Record<string, string>, scholarship: Record<string, string>) => `
Write a personal statement for a scholarship application.

Student: ${profile.full_name}, Liberian national
Field: ${profile.field_of_study}, ${profile.degree_level}
GPA: ${profile.gpa} at ${profile.current_institution}
Work Experience: ${profile.work_experience}
Achievements: ${profile.achievements}
Extracurriculars: ${Array.isArray(profile.extracurriculars) ? profile.extracurriculars.join(', ') : profile.extracurriculars}
Financial need: ${profile.financial_need ? 'Yes' : 'No'}
Personal statement notes: ${profile.personal_statement}

Scholarship: ${scholarship.title} by ${scholarship.provider}

Write a compelling 400-word personal statement that:
- Opens with a story or vivid hook
- Covers academic journey and why this field
- Discusses impact of Liberian context on their goals
- Explains why this specific scholarship
- Ends with vision for impact back home

IMPORTANT: Output plain text only. No markdown, no HTML tags, no asterisks, no special formatting symbols. Use paragraph breaks (blank lines) between paragraphs.

Write only the statement — no preamble, no commentary.`,
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, profile, scholarship } = await req.json()

  const prompt = type === 'cover_letter'
    ? PROMPTS.cover_letter(profile, scholarship)
    : PROMPTS.personal_statement(profile, scholarship)

  try {
    const openai = getOpenAI()
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 800,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
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
          const msg = err instanceof Error ? err.message : 'Generation failed'
          controller.enqueue(enc.encode(`ERROR: ${msg}`))
          controller.close()
        }
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
