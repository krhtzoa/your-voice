/**
 * Calls the local create-content API to generate content via OpenAI.
 * @param {{ prompt: string, duration?: number, platform?: string }} params
 * @returns {Promise<{ content: string }>}
 */
export async function createContent({ prompt, duration, platform }) {
  const res = await fetch('/api/create-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration, platform }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}
