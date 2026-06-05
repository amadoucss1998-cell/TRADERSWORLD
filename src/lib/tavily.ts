export async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      max_results: 8,
      include_answer: false,
    }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}
