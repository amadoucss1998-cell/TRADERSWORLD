import type { Profile } from '@/types/profile'

export function buildRankerPrompt(profile: Profile, scholarships: unknown[]): string {
  return `You are an expert scholarship advisor specializing in opportunities for Liberian and West African students.

Given this student profile and list of scholarships, score each scholarship 0-100 based on:
- Eligibility match (nationality, degree level, field of study)
- GPA requirements vs student's GPA (${profile.gpa})
- Financial need alignment
- Likelihood of acceptance given background

Student Profile:
${JSON.stringify({
  nationality: profile.nationality,
  degree_level: profile.degree_level,
  field_of_study: profile.field_of_study,
  gpa: profile.gpa,
  graduation_year: profile.graduation_year,
  english_proficiency: profile.english_proficiency,
  financial_need: profile.financial_need,
  achievements: profile.achievements,
}, null, 2)}

Scholarships to evaluate:
${JSON.stringify(scholarships, null, 2)}

Return ONLY a valid JSON array (no markdown, no explanation):
[{ "index": 0, "score": 85, "match_reason": "Strong match: open to West African students, aligns with field", "eligible": true }]`
}
