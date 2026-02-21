/**
 * Calls the local create-content API to generate content via OpenAI.
 * @param {{ prompt: string, duration?: number, platform?: string, accessToken?: string }} params
 * @returns {Promise<{ content: string }>}
 */
export async function createContent({ prompt, duration, platform, accessToken }) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const res = await fetch('/api/create-content', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, duration, platform }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}
