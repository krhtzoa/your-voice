/**
 * Lightweight Jaccard similarity for voice rule deduplication.
 * No dependencies — pure word-set math.
 *
 * Two thresholds by category:
 *   voice     — lower threshold (0.38): communication/style directives are
 *               short and formulaic, so overlap is a strong signal.
 *   expertise — higher threshold (0.58): two expertise facts can share domain
 *               vocabulary (CO2, ventilation, sleep) while teaching genuinely
 *               different things. Only flag near-identical statements.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'be', 'was', 'this', 'that', 'it', 'they',
  'do', 'not', 'no', 'as', 'by', 'from', 'you', 'your', 'i', 'my', 'we',
  'our', 'when', 'where', 'how', 'what', 'which', 'who', 'will', 'should',
  'can', 'may', 'must', 'never', 'always', 'any', 'all', 'more', 'than',
  'so', 'if', 'then', 'use', 'used', 'using', 'also', 'just', 'very',
])

// Minimum word length to include in comparison
const MIN_WORD_LEN = 3

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= MIN_WORD_LEN && !STOP_WORDS.has(w))
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  if (setA.size === 0 && setB.size === 0) return 0
  const intersection = [...setA].filter((w) => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

const THRESHOLDS = {
  voice: 0.38,
  expertise: 0.58,
}

/**
 * Returns existing rules that are suspiciously similar to newRuleText,
 * sorted by similarity score descending.
 *
 * Only compares within the same category — voice rules never flag against
 * expertise rules even if they share words.
 *
 * @param {string} newRuleText
 * @param {Array<{id: string, content: string, category: string}>} existingRules
 * @param {'voice'|'expertise'} category
 * @returns {Array<{rule: object, score: number}>}
 */
export function findSimilarRules(newRuleText, existingRules, category = 'voice') {
  const threshold = THRESHOLDS[category] ?? THRESHOLDS.voice

  return existingRules
    .filter((r) => (r.category ?? 'voice') === category)
    .map((r) => ({ rule: r, score: jaccardSimilarity(newRuleText, r.content) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
}

/**
 * Filters expertise rules by relevance to a prompt using Jaccard similarity.
 * Zero API calls — pure keyword overlap math.
 *
 * Returns all rules when the library is small (≤ topN), so there's no
 * behaviour change until the expertise library actually grows beyond the cap.
 * Once it does, the topN highest-scoring rules are kept, ensuring the prompt
 * stays focused without losing coverage for the topic at hand.
 *
 * @param {string} promptText - The user's script topic/prompt
 * @param {Array<{content: string}>} expertiseRules - Pre-filtered expertise rules
 * @param {{ topN?: number }} opts
 * @returns {Array} Subset of expertiseRules, sorted by relevance descending
 */
export function filterRelevantExpertise(promptText, expertiseRules, { topN = 12 } = {}) {
  if (!expertiseRules || expertiseRules.length === 0) return []
  // Below the cap: include everything — no filtering overhead
  if (expertiseRules.length <= topN) return expertiseRules

  return expertiseRules
    .map((r) => ({ rule: r, score: jaccardSimilarity(promptText, r.content) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ rule }) => rule)
}

/**
 * Returns a debug report showing which expertise rules were included vs
 * excluded, with their Jaccard scores. Use this to validate the filter.
 *
 * @param {string} promptText
 * @param {Array<{content: string}>} expertiseRules
 * @param {{ topN?: number }} opts
 * @returns {{ included: Array, excluded: Array, totalAvailable: number, topN: number }}
 */
export function debugExpertiseFilter(promptText, expertiseRules, { topN = 12 } = {}) {
  if (!expertiseRules || expertiseRules.length === 0) {
    return { included: [], excluded: [], totalAvailable: 0, topN }
  }

  const scored = expertiseRules
    .map((r) => ({
      score: jaccardSimilarity(promptText, r.content ?? ''),
      preview: (r.content ?? '').slice(0, 80) + ((r.content ?? '').length > 80 ? '…' : ''),
      source_label: r.source_label ?? null,
    }))
    .sort((a, b) => b.score - a.score)

  const belowCap = expertiseRules.length <= topN

  return {
    totalAvailable: expertiseRules.length,
    topN,
    belowCap,
    included: belowCap ? scored : scored.slice(0, topN),
    excluded: belowCap ? [] : scored.slice(topN),
  }
}
