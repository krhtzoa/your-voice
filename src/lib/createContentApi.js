/**
 * Calls the local create-content API to generate content via OpenAI.
 * @param {{ prompt: string, duration?: number, platform?: string, accessToken?: string }} params
 * @returns {Promise<{ content: string }>}
 */
import { API_BASE } from './apiBase.js'

export async function createContent({ prompt, duration, platform, accessToken }) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const res = await fetch(`${API_BASE}/create-content`, {
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

  if (data._expertiseDebug) {
    const d = data._expertiseDebug
    const active = !d.belowCap
    console.groupCollapsed(
      `%c[your-voice] Expertise filter — ${d.included.length} of ${d.totalAvailable} rules injected${active ? ` (cap: ${d.topN})` : ' (all included, below cap)'}`,
      'color: #7c3aed; font-weight: bold;'
    )
    if (d.included.length) {
      console.log('%c✓ Included:', 'color: #059669; font-weight: bold;')
      d.included.forEach((r) => console.log(`  [${r.score.toFixed(3)}] ${r.preview}${r.source_label ? ` — ${r.source_label}` : ''}`))
    }
    if (d.excluded.length) {
      console.log('%c✗ Excluded:', 'color: #dc2626; font-weight: bold;')
      d.excluded.forEach((r) => console.log(`  [${r.score.toFixed(3)}] ${r.preview}${r.source_label ? ` — ${r.source_label}` : ''}`))
    }
    console.groupEnd()
  }

  return data
}
