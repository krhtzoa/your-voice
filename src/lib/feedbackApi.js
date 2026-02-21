/**
 * Submits feedback on a script. Server extracts rules and inserts into voice_rules.
 * @param {{ feedbackText: string, scriptContent: string, scriptId?: string, accessToken?: string }} params
 * @returns {Promise<{ rulesAdded: number }>}
 */
export async function submitFeedback({ feedbackText, scriptContent, scriptId, accessToken }) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      feedbackText: feedbackText.trim(),
      scriptContent,
      scriptId: scriptId || null,
    }),
  })
  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(res.status >= 500 ? 'Server error. Try again.' : `Request failed (${res.status})`)
    }
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}
