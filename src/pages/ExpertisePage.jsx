import { useState } from 'react'
import { Lightbulb, BookOpen, MessageCircle, Plus, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { extractExpertise } from '../lib/expertiseApi.js'
import { createRule } from '../lib/voiceRules.js'

const sectionClass =
  'w-full max-w-[600px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm'

function ItemList({ items, title, icon: Icon, onAddAsRule, addedIds }) {
  if (!items?.length) return null
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-min font-semibold text-slate-800">
        <Icon className="h-4 w-4 text-slate-600" strokeWidth={2} />
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-min text-slate-700"
          >
            <span className="flex-1">{item}</span>
            {onAddAsRule && (
              <button
                type="button"
                onClick={() => onAddAsRule(item)}
                disabled={addedIds?.has(item)}
                className="shrink-0 rounded px-2 py-1 text-[0.75rem] font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 disabled:bg-emerald-100 disabled:text-emerald-700"
                title={addedIds?.has(item) ? 'Added to rules' : 'Add as voice rule'}
              >
                {addedIds?.has(item) ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Added
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add rule
                  </span>
                )}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ExpertisePage() {
  const { user, session } = useAuth()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [addedAsRules, setAddedAsRules] = useState(new Set())

  async function handleExtract(e) {
    e.preventDefault()
    const url = youtubeUrl.trim()
    if (!url) {
      setError('Enter a YouTube URL')
      return
    }
    setExtracting(true)
    setError('')
    setResult(null)
    try {
      const data = await extractExpertise({ youtubeUrl: url, accessToken: session?.access_token })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to extract')
    } finally {
      setExtracting(false)
    }
  }

  async function handleAddAsRule(text) {
    if (!user?.id || !text?.trim()) return
    const { error: err } = await createRule(user.id, {
      content: text.trim(),
      rule_type: 'general',
      source: 'feedback', // expertise-derived rules stored as feedback source
    })
    if (!err) {
      setAddedAsRules((prev) => new Set([...prev, text]))
    }
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 py-8">
      <div className={sectionClass}>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Lightbulb className="h-5 w-5 text-amber-500" strokeWidth={2} />
          Extract expertise from YouTube
        </h2>
        <p className="mb-4 text-min text-slate-600">
          Paste a YouTube link and we&apos;ll pull the transcript, then extract knowledge,
          perspectives, and communication styles you can learn from.
        </p>
        <form onSubmit={handleExtract} className="space-y-4">
          <div>
            <label htmlFor="youtube-url" className="mb-1.5 block text-min font-medium text-slate-700">
              YouTube URL
            </label>
            <input
              id="youtube-url"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              disabled={extracting}
            />
          </div>
          {error && (
            <p className="text-min text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={extracting}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {extracting ? 'Extracting…' : 'Extract expertise'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          {result.transcript && (
            <div className={sectionClass}>
              <h3 className="mb-2 text-min font-semibold text-slate-800">Transcript preview</h3>
              <p className="max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-min text-slate-700">
                {result.transcript}
                {result.transcriptLength > 2000 && '…'}
              </p>
              <p className="mt-2 text-[0.75rem] text-slate-500">
                {result.transcriptLength.toLocaleString()} characters total
              </p>
            </div>
          )}

          <div className={sectionClass}>
            <h3 className="mb-4 text-min font-semibold text-slate-800">Extracted insights</h3>
            <div className="space-y-6">
              <ItemList
                items={result.knowledge}
                title="Knowledge"
                icon={BookOpen}
                onAddAsRule={handleAddAsRule}
                addedIds={addedAsRules}
              />
              <ItemList
                items={result.perspectives}
                title="Perspectives"
                icon={Lightbulb}
                onAddAsRule={handleAddAsRule}
                addedIds={addedAsRules}
              />
              <ItemList
                items={result.communicationStyles}
                title="Communication styles"
                icon={MessageCircle}
                onAddAsRule={handleAddAsRule}
                addedIds={addedAsRules}
              />
            </div>
            {addedAsRules.size > 0 && (
              <p className="mt-4 text-min text-slate-600">
                {addedAsRules.size} item{addedAsRules.size !== 1 ? 's' : ''} added to your voice rules.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
