import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'

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

Write only the letter — no preamble.`,

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

Write only the statement — no preamble.`,
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
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 800,
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

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch {
    // Fallback when Claude not configured
    const fallback = type === 'cover_letter'
      ? `Dear Scholarship Committee,\n\nI am writing to apply for the ${scholarship.title} offered by ${scholarship.provider}. As a ${profile.degree_level} student in ${profile.field_of_study} at ${profile.current_institution} with a GPA of ${profile.gpa}, I am confident that I meet and exceed the eligibility criteria for this award.\n\nMy academic journey has been shaped by a deep commitment to excellence and a desire to contribute meaningfully to Liberia's development. Through my studies and extracurricular activities, I have developed both the technical skills and the leadership qualities that your scholarship seeks to nurture.\n\nI respectfully request your consideration of my application. The ${scholarship.title} would be transformative — not just for my career, but for the communities I intend to serve upon my return to Liberia.\n\nThank you for your time and consideration.\n\nSincerely,\n${profile.full_name}`
      : `Growing up in Liberia, I learned early that education is the most powerful force for change. This conviction has driven every academic and personal decision I have made.\n\nAs a ${profile.degree_level} student in ${profile.field_of_study} maintaining a ${profile.gpa} GPA at ${profile.current_institution}, I have proven my ability to excel academically while remaining grounded in the realities of my community. ${profile.achievements ? `My achievements include: ${profile.achievements}.` : ''}\n\nThe ${scholarship.title} represents an opportunity to access world-class education that will equip me to address the challenges Liberia faces. My goal is not simply to study abroad — it is to return with the expertise and networks necessary to build lasting institutions.\n\nI am committed to making the most of this opportunity. With your support, I will.\n\n— ${profile.full_name}`

    return new Response(fallback, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}
