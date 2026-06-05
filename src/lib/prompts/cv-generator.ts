import type { Profile } from '@/types/profile'

export function buildCVPrompt(profile: Profile, targetField: string): string {
  return `You are an expert academic CV writer for scholarship applications.

Create a professional academic CV for this student targeting ${targetField} scholarships.

Student Profile:
${JSON.stringify(profile, null, 2)}

Generate a well-formatted CV in Markdown with these sections:
1. Personal Information (name, email, nationality)
2. Education (current institution, degree, GPA, expected graduation)
3. Research/Academic Achievements
4. Work Experience
5. Extracurricular Activities & Leadership
6. Skills (languages, technical)
7. References (Available upon request)

Use clean markdown formatting. Be specific and impactful.`
}
