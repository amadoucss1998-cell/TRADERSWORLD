import type { Profile } from '@/types/profile'

export function buildCVPrompt(profile: Profile, targetField: string): string {
  return `You are an expert academic CV writer for scholarship applications.

Create a professional academic CV for this student targeting ${targetField} scholarships.

Student Profile:
- Name: ${profile.full_name || 'N/A'}
- Email: ${profile.email || 'N/A'}
- Nationality: ${profile.nationality || 'Liberian'}
- Institution: ${profile.current_institution || 'N/A'}
- Degree: ${profile.degree_level || 'N/A'} in ${profile.field_of_study || 'N/A'}
- GPA: ${profile.gpa || 'N/A'}
- Expected Graduation: ${profile.graduation_year || 'N/A'}
- Work Experience: ${profile.work_experience || 'None listed'}
- Achievements: ${profile.achievements || 'None listed'}
- Extracurriculars: ${Array.isArray(profile.extracurriculars) ? profile.extracurriculars.join(', ') : profile.extracurriculars || 'None listed'}
- English Proficiency: ${profile.english_proficiency || 'Fluent'}

IMPORTANT: Output plain text only. No markdown, no asterisks, no pound signs (#), no HTML tags.
Use UPPERCASE for section headers. Use a dash (-) for bullet points. Separate sections with a blank line.

Structure:
CURRICULUM VITAE

[Full Name]
[Email] | [Nationality]

EDUCATION
- [Degree] in [Field], [Institution] (Expected [Year])
- GPA: [GPA]

ACADEMIC ACHIEVEMENTS
- [List achievements]

WORK EXPERIENCE
- [List experience]

EXTRACURRICULAR ACTIVITIES
- [List activities]

SKILLS
- Languages: English ([proficiency level])
- [Other skills]

REFERENCES
Available upon request`
}
