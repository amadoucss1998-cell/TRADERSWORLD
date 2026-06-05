export function buildImproverPrompt(
  currentEssay: string,
  instruction: string,
  wordLimit: number
): string {
  return `You are an expert scholarship essay editor.

Current Essay:
${currentEssay}

Word Limit: ${wordLimit} words

Instruction: "${instruction}"

Revise the essay following the instruction exactly. Return ONLY the revised essay (no explanation, no preamble). Keep it within ${wordLimit} words.`
}
