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
  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // Proxy/HTML error page or truncated response
      const hint = res.status >= 500
        ? 'API server may be down. Run `npm run dev` (starts both Vite + API). Check terminal for errors.'
        : `Request failed (${res.status})`
      throw new Error(hint)
    }
  }
  if (!res.ok) {
    const msg = data.error || (res.status >= 500 ? 'API server error. Run `npm run dev` and check terminal for details.' : `Request failed (${res.status})`)
    throw new Error(msg)
  }
  return data
}
