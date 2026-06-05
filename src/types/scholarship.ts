export interface Scholarship {
  id: string
  title: string
  provider: string
  country: string
  amount: string
  deadline: string
  degree_levels: string[]
  fields_of_study: string[]
  eligibility: string
  description: string
  url: string
  source: string
  match_score: number
  match_reason?: string
  created_at: string
}

export interface SavedScholarship {
  id: string
  user_id: string
  scholarship_id: string
  scholarship: Scholarship
  notes: string
  saved_at: string
}
