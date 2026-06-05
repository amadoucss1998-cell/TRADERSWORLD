import { NextRequest } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { tavilySearch } from '@/lib/tavily'
import { buildRankerPrompt } from '@/lib/prompts/scholarship-ranker'

export async function POST(req: NextRequest) {
  const { profile, filters } = await req.json()

  // Build search queries based on profile
  const queries = [
    `scholarships for Liberian students ${profile.field_of_study} ${profile.degree_level} 2025 2026`,
    `fully funded ${profile.degree_level} scholarship West Africa ${profile.field_of_study} 2025`,
    `Africa scholarship ${profile.field_of_study} international students 2025 no GRE`,
    `scholarship for students from Liberia ${profile.degree_level} abroad 2025`,
  ]

  // Search in parallel
  const results = await Promise.all(queries.map(q => tavilySearch(q)))
  const rawScholarships = results.flat()

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = rawScholarships.filter(s => {
    if (seen.has(s.url)) return false
    seen.add(s.url)
    return true
  })

  // Format for Claude
  const formatted = unique.slice(0, 20).map((s, i) => ({
    index: i,
    title: s.title,
    description: s.content.slice(0, 300),
    url: s.url,
  }))

  // Apply filters if provided
  void filters // used for future filtering

  // Claude ranking
  let ranked
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: buildRankerPrompt(profile, formatted),
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const scores = JSON.parse(text) as Array<{ index: number; score: number; match_reason: string; eligible: boolean }>

    ranked = scores
      .filter(s => s.eligible)
      .sort((a, b) => b.score - a.score)
      .map(s => ({
        ...formatted[s.index],
        match_score: s.score,
        match_reason: s.match_reason,
        id: crypto.randomUUID(),
        provider: formatted[s.index].title.split('|')[0] || 'Unknown',
        country: 'International',
        amount: 'Varies',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        degree_levels: [profile.degree_level],
        fields_of_study: [profile.field_of_study],
        eligibility: s.match_reason,
        source: 'Tavily',
        created_at: new Date().toISOString(),
      }))
  } catch {
    // Return raw results if Claude fails
    ranked = formatted.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      match_score: 50,
      match_reason: 'Potential match',
      provider: 'Unknown',
      country: 'International',
      amount: 'Varies',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      degree_levels: [],
      fields_of_study: [],
      eligibility: '',
      source: 'Tavily',
      created_at: new Date().toISOString(),
    }))
  }

  return Response.json({ scholarships: ranked })
}
