/**
 * Extracts knowledge, perspectives, and communication styles from a YouTube transcript.
 * @param {{ youtubeUrl: string, accessToken?: string }} params
 * @returns {Promise<{ transcript: string, transcriptLength: number, knowledge: string[], perspectives: string[], communicationStyles: string[] }>}
 */
export async function extractExpertise({ youtubeUrl, accessToken }) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const res = await fetch('/api/expertise/extract', {
    method: 'POST',
    headers,
    body: JSON.stringify({ youtubeUrl: youtubeUrl?.trim() }),
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
