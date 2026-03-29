const NLP_URL = process.env.NLP_SERVICE_URL

if (!NLP_URL) {
  throw new Error("NLP_SERVICE_URL is not set")
}

export async function analyzeSentence(text: string) {
  const res = await fetch(`${NLP_URL}/analyze/sentence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`NLP service error: ${res.status}`)
  return res.json() as Promise<{
    tokens: {
      text: string
      lemma: string
      pos: string
      tag: string
      dep: string
      morph: string
      is_stop: boolean
    }[]
  }>
}

export async function analyzeWord(word: string, context?: string) {
  const res = await fetch(`${NLP_URL}/analyze/word`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, context }),
  })
  if (!res.ok) throw new Error(`NLP service error: ${res.status}`)
  return res.json() as Promise<{
    word: string
    spacy: {
      lemma: string
      pos: string
      tag: string
      morph: string
    } | null
    demorphy: string[]
  }>
}
