import { NextRequest } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { tavilySearch } from '@/lib/tavily'
import { buildRankerPrompt } from '@/lib/prompts/scholarship-ranker'

// Real scholarships used as fallback when Tavily isn't configured
const FALLBACK_SCHOLARSHIPS = [
  { title: 'MasterCard Foundation Scholars Program', url: 'https://mastercardfdn.org/scholars', description: 'Fully funded scholarships for African students with academic excellence and financial need. Covers tuition, living, travel, and health insurance.' },
  { title: 'Commonwealth Scholarship and Fellowship Plan', url: 'https://cscuk.fcdo.gov.uk', description: 'UK government-funded fully funded scholarships for citizens of Commonwealth countries including Liberia for masters and PhD study.' },
  { title: 'DAAD Scholarships for Development-Related Postgraduate Courses', url: 'https://daad.de/en', description: 'Monthly stipend €861 plus tuition for students from developing countries to study in Germany. Courses taught in English.' },
  { title: 'Aga Khan Foundation International Scholarship', url: 'https://akdn.org/scholarships', description: 'Supports outstanding students from developing countries who have no other means of pursuing postgraduate education abroad.' },
  { title: 'African Union Scholarships', url: 'https://au.int/scholarships', description: 'Scholarships for African students to study at African universities or abroad. Open to all African Union member states including Liberia.' },
  { title: 'Erasmus Mundus Joint Masters Scholarships', url: 'https://erasmus-plus.ec.europa.eu', description: 'EU-funded scholarships covering full tuition, monthly allowance €1,000, travel, and installation costs for international students.' },
  { title: 'Swedish Institute Scholarships for Global Professionals', url: 'https://si.se/scholarships', description: 'Fully funded scholarships for study in Sweden at masters level. Open to students from eligible developing countries.' },
  { title: 'Rotary Peace Fellowships', url: 'https://rotary.org/peace-fellowships', description: 'Full funding for masters degree in peace and conflict studies at partner universities worldwide. Includes stipend and travel.' },
  { title: 'OFID Scholarship Award', url: 'https://ofid.org/scholarship', description: 'Annual scholarship for students from developing countries including Liberia for masters study in development-related fields.' },
  { title: 'Joint Japan/World Bank Graduate Scholarship Program', url: 'https://worldbank.org/scholarships', description: 'Fully funded scholarships for development professionals from developing countries to pursue masters degrees at universities worldwide.' },
  { title: 'Fulbright Foreign Student Program', url: 'https://fulbrightprogram.org', description: 'US government-funded full scholarships for graduate students, artists, and young professionals from over 160 countries including Liberia.' },
  { title: 'Heinrich Böll Foundation Scholarships', url: 'https://boell.de/scholarships', description: 'German scholarships for international students with focus on ecology, democracy, and human rights. Open to all degree levels.' },
]

function isTavilyConfigured() {
  const key = process.env.TAVILY_API_KEY ?? ''
  return key.length > 10 && !key.includes('placeholder')
}

function isAnthropicConfigured() {
  const key = process.env.ANTHROPIC_API_KEY ?? ''
  return key.startsWith('sk-ant-') && !key.includes('placeholder')
}

export async function POST(req: NextRequest) {
  const { profile, filters } = await req.json()

  let formatted: typeof FALLBACK_SCHOLARSHIPS

  if (isTavilyConfigured()) {
    // Live search via Tavily
    const queries = [
      `scholarships for Liberian students ${profile.field_of_study} ${profile.degree_level} 2025 2026`,
      `fully funded ${profile.degree_level} scholarship West Africa ${profile.field_of_study} 2025`,
      `Africa scholarship ${profile.field_of_study} international students 2025 no GRE`,
      `scholarship for students from Liberia ${profile.degree_level} abroad 2025`,
    ]
    const results = await Promise.all(queries.map(q => tavilySearch(q)))
    const rawScholarships = results.flat()

    const seen = new Set<string>()
    const unique = rawScholarships.filter(s => {
      if (seen.has(s.url)) return false
      seen.add(s.url)
      return true
    })

    formatted = unique.slice(0, 20).map(s => ({
      title: s.title,
      description: s.content.slice(0, 300),
      url: s.url,
    }))
  } else {
    // Fallback: use curated real scholarships
    formatted = FALLBACK_SCHOLARSHIPS
  }

  void filters

  // Claude ranking
  let ranked
  if (isAnthropicConfigured()) {
    try {
      const indexedFormatted = formatted.map((s, i) => ({ index: i, ...s }))
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildRankerPrompt(profile, indexedFormatted) }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
      const scores = JSON.parse(text) as Array<{ index: number; score: number; match_reason: string; eligible: boolean }>

      ranked = scores
        .filter(s => s.eligible)
        .sort((a, b) => b.score - a.score)
        .map(s => buildScholarship(formatted[s.index], s.score, s.match_reason, profile))
    } catch {
      ranked = formatted.map(s => buildScholarship(s, 70, 'Potential match based on your profile', profile))
    }
  } else {
    // No Claude — return all fallback scholarships with reasonable scores
    ranked = formatted.map((s, i) => buildScholarship(s, 90 - i * 3, 'Curated match for Liberian students', profile))
  }

  return Response.json({
    scholarships: ranked,
    demo: !isTavilyConfigured(),
  })
}

function buildScholarship(
  s: { title: string; description: string; url: string },
  score: number,
  matchReason: string,
  profile: { degree_level?: string; field_of_study?: string }
) {
  return {
    id: crypto.randomUUID(),
    title: s.title,
    provider: s.title.split(' ').slice(0, 3).join(' '),
    description: s.description,
    url: s.url,
    country: 'International',
    amount: 'Fully Funded',
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    degree_levels: profile.degree_level ? [profile.degree_level] : ['masters'],
    fields_of_study: profile.field_of_study ? [profile.field_of_study] : ['All Fields'],
    eligibility: matchReason,
    match_score: Math.min(99, score),
    match_reason: matchReason,
    source: isTavilyConfigured() ? 'Tavily' : 'Curated',
    created_at: new Date().toISOString(),
  }
}

