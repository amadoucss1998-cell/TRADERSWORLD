import OpenAI from 'openai'

export const OPENAI_MODEL = 'gpt-4o-mini'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('OPENAI_API_KEY is not configured. Add it to your environment variables.')
    }
    _openai = new OpenAI({ apiKey })
  }
  return _openai
}
