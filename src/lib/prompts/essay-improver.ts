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

Revise the essay following the instruction exactly. Output plain text only — no markdown, no HTML, no asterisks. Use blank lines between paragraphs. Return ONLY the revised essay (no explanation, no preamble). Keep it within ${wordLimit} words.`
}
