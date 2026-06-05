import type { Profile } from '@/types/profile'

export function buildEssayPrompt(
  profile: Profile,
  scholarshipName: string,
  provider: string,
  scholarshipDescription: string,
  essayPrompt: string,
  wordLimit: number
): string {
  return `You are an expert scholarship essay writer helping a Liberian student apply for the ${scholarshipName} scholarship offered by ${provider}.

Student Background:
- Name: ${profile.full_name}
- Field of Study: ${profile.field_of_study}
- Degree Level: ${profile.degree_level}
- Current Institution: ${profile.current_institution}
- GPA: ${profile.gpa}
- Achievements: ${profile.achievements}
- Work Experience: ${profile.work_experience}
- Extracurriculars: ${profile.extracurriculars?.join(', ')}
- Personal Statement Notes: ${profile.personal_statement}

Scholarship Mission/Description:
${scholarshipDescription}

Essay Prompt: "${essayPrompt}"
Word Limit: ${wordLimit} words

Write a compelling, authentic scholarship essay that:
1. Opens with a powerful hook that draws the reader in
2. Weaves in the student's Liberian background authentically where relevant
3. Clearly connects their goals to the scholarship's mission
4. Demonstrates specific achievements with impact
5. Ends with a memorable conclusion about future impact
6. Stays strictly within ${wordLimit} words
7. Uses clear, confident academic English

Write the essay directly — no preamble, no "Here is the essay:" — just the essay itself.`
}
