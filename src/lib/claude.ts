import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

let _anthropic: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Add it to your environment variables.')
    }
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

// Keep named export for backward compat — lazily resolved
export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return getAnthropic()[prop as keyof Anthropic]
  },
})
