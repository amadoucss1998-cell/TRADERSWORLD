export interface Application {
  id: string
  user_id: string
  scholarship_id: string
  scholarship?: import('./scholarship').Scholarship
  status: 'drafting' | 'submitted' | 'interview' | 'accepted' | 'rejected'
  deadline: string
  essay_prompt: string
  essay_draft: string
  essay_version: number
  word_limit: number
  notes: string
  documents: string[]
  created_at: string
  updated_at: string
}

export interface EssayVersion {
  id: string
  application_id: string
  version: number
  content: string
  saved_at: string
}
