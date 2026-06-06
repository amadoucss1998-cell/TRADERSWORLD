import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Curated mock scholarships that look realistic and relevant to Liberian students
const MOCK_SCHOLARSHIPS = [
  {
    id: '1',
    title: 'MasterCard Foundation Scholars Program',
    provider: 'MasterCard Foundation',
    country: 'USA / Canada / Africa',
    amount: 'Fully Funded',
    deadline: new Date(Date.now() + 78 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    degree_levels: ['undergraduate', 'masters'],
    fields_of_study: ['All Fields'],
    eligibility: 'African students demonstrating academic excellence and financial need',
    description: 'Covers tuition, living expenses, travel, and health insurance. Includes leadership development and mentorship.',
    url: 'https://mastercardfdn.org/scholars',
    match_score: 94,
    match_reason: 'Open to all African nationalities including Liberia. Strong fit for financial need profile.',
  },
  {
    id: '2',
    title: 'Commonwealth Scholarship and Fellowship Plan',
    provider: 'Commonwealth Scholarship Commission (UK)',
    country: 'United Kingdom',
    amount: 'Fully Funded',
    deadline: new Date(Date.now() + 102 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    degree_levels: ['masters', 'phd'],
    fields_of_study: ['STEM', 'Social Sciences', 'Development Studies'],
    eligibility: 'Citizens of Commonwealth countries including Liberia with strong academic record',
    description: 'Full tuition, monthly stipend £1,347, travel, and thesis allowance. Prestigious government-funded award.',
    url: 'https://cscuk.fcdo.gov.uk',
    match_score: 88,
    match_reason: 'Liberia is a Commonwealth member. Excellent match for degree level and academic background.',
  },
  {
    id: '3',
    title: 'DAAD Scholarships for Development-Related Postgraduate Courses',
    provider: 'DAAD (German Academic Exchange Service)',
    country: 'Germany',
    amount: '€861/month + tuition',
    deadline: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    degree_levels: ['masters'],
    fields_of_study: ['Engineering', 'Agriculture', 'Social Sciences', 'Public Health'],
    eligibility: 'Graduates from developing countries with 2+ years work experience',
    description: 'Monthly stipend, travel costs, health insurance, and study allowances. Courses taught in English.',
    url: 'https://daad.de/en',
    match_score: 82,
    match_reason: 'Strong DAAD focus on West African students. Work experience requirement aligns with your profile.',
  },
  {
    id: '4',
    title: 'Aga Khan Foundation International Scholarship',
    provider: 'Aga Khan Foundation',
    country: 'Multiple Countries',
    amount: '50% grant / 50% loan',
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    degree_levels: ['masters'],
    fields_of_study: ['All Fields'],
    eligibility: 'Students from select developing countries with no other funding source',
    description: 'Supports outstanding students who have no other means of pursuing postgraduate education abroad.',
    url: 'https://akdn.org/scholarships',
    match_score: 76,
    match_reason: 'Covers students with financial need from West Africa. Good alignment with your background.',
  },
]

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { allowed, remaining, resetIn } = checkRateLimit(`demo-search:${ip}`)

  if (!allowed) {
    const minutes = Math.ceil(resetIn / 60000)
    return Response.json(
      { error: `Rate limit reached. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) },
      }
    )
  }

  // Simulate a short search delay so the loading state is visible
  await new Promise(r => setTimeout(r, 1200))

  const { profile } = await req.json().catch(() => ({ profile: {} }))

  // Personalise match scores slightly based on field/degree
  const scholarships = MOCK_SCHOLARSHIPS.map(s => ({
    ...s,
    match_score: adjustScore(s, profile),
  })).sort((a, b) => b.match_score - a.match_score)

  return Response.json({ scholarships, remaining })
}

function adjustScore(
  s: (typeof MOCK_SCHOLARSHIPS)[number],
  profile: { degree_level?: string; field_of_study?: string }
): number {
  let score = s.match_score
  if (profile.degree_level && s.degree_levels.includes(profile.degree_level)) score += 3
  if (
    profile.field_of_study &&
    (s.fields_of_study.includes('All Fields') ||
      s.fields_of_study.some(f => f.toLowerCase().includes(profile.field_of_study?.toLowerCase() ?? '')))
  ) {
    score += 2
  }
  return Math.min(99, score)
}
