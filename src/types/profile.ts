export interface Profile {
  id: string
  full_name: string
  email: string
  nationality: string
  date_of_birth: string
  gender: string
  gpa: number
  degree_level: 'high_school' | 'undergraduate' | 'masters' | 'phd'
  field_of_study: string
  current_institution: string
  graduation_year: number
  english_proficiency: 'native' | 'fluent' | 'intermediate'
  financial_need: boolean
  extracurriculars: string[]
  work_experience: string
  achievements: string
  personal_statement: string
  plan: 'free' | 'student' | 'premium'
  usage_count: number
  created_at: string
  updated_at: string
}
