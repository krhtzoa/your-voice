import { useState, useEffect, useCallback } from 'react'
import { Lightbulb, BookOpen, MessageCircle, Plus, Check, Pencil, Trash2, Brain } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { extractExpertise } from '../lib/expertiseApi.js'
import {
  fetchRulesByCategory,
  createRule,
  updateRule,
  deleteRule,
  RULE_TYPES,
} from '../lib/voiceRules.js'

const sectionClass =
  'w-full max-w-[640px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm'

// ── Extracted insight list (from YouTube extraction) ──────────────────────────
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
                title={addedIds?.has(item) ? 'Added to expertise' : 'Save as expertise'}
              >
                {addedIds?.has(item) ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Save
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

// ── Saved expertise CRUD ──────────────────────────────────────────────────────
function SavedExpertise({ userId, refreshTrigger }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addContent, setAddContent] = useState('')
  const [addType, setAddType] = useState('general')
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editType, setEditType] = useState('general')
  const [savingId, setSavingId] = useState(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error: err } = await fetchRulesByCategory(userId, 'expertise')
    if (err) {
      setError(err.message)
    } else {
      setRules(data ?? [])
      setError('')
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load, refreshTrigger])

  async function handleAdd(e) {
    e.preventDefault()
    const content = addContent.trim()
    if (!content || !userId) return
    setAdding(true)
    setError('')
    const { error: err } = await createRule(userId, {
      content,
      rule_type: addType,
      source: 'manual',
      category: 'expertise',
    })
    setAdding(false)
    if (err) { setError(err.message); return }
    setAddContent('')
    setAddType('general')
    load()
  }

  function startEdit(rule) {
    setEditingId(rule.id)
    setEditContent(rule.content)
    setEditType(rule.rule_type)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
    setEditType('general')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editingId || !userId) return
    setSavingId(editingId)
    setError('')
    const { error: err } = await updateRule(userId, editingId, {
      content: editContent.trim(),
      rule_type: editType,
    })
    setSavingId(null)
    if (err) { setError(err.message); return }
    setEditingId(null)
    load()
  }

  async function handleDelete(ruleId) {
    if (!userId || !ruleId) return
    setDeletingId(ruleId)
    const { error: err } = await deleteRule(userId, ruleId)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (err) { setError(err.message); return }
    load()
  }

  return (
    <div className={sectionClass}>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800">
        <Brain className="h-5 w-5 text-violet-500" strokeWidth={2} />
        Your expertise knowledge
      </h2>
      <p className="mb-5 text-min text-slate-500">
        Facts, frameworks, and perspectives you hold that the AI uses when generating content.
        These are separate from communication style rules.
      </p>

      {/* Add new */}
      <form onSubmit={handleAdd} className="mb-6 space-y-3">
        <div>
          <label htmlFor="expertise-add" className="mb-1 block text-min font-medium text-slate-700">
            Add expertise manually
          </label>
          <textarea
            id="expertise-add"
            value={addContent}
            onChange={(e) => setAddContent(e.target.value)}
            placeholder="e.g., The 3 pillars of IAQ are filtration, ventilation, and humidity control."
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-min text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {RULE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding || !addContent.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      {error && <p className="mb-3 text-min text-red-600">{error}</p>}

      {/* List */}
      {loading ? (
        <p className="text-min text-slate-500">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-min text-slate-400">
          No expertise saved yet. Extract from a YouTube video above or add one manually.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              {editingId === rule.id ? (
                <form onSubmit={handleSaveEdit} className="flex flex-col gap-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-min text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    {RULE_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingId === rule.id}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-min font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {savingId === rule.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-min font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1 text-base text-slate-800">{rule.content}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(rule)}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(rule.id)}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded px-2 py-0.5 text-min font-medium bg-violet-100 text-violet-700">
                      expertise
                    </span>
                    {rule.rule_type !== 'general' && (
                      <span className="inline-flex rounded px-2 py-0.5 text-min font-medium bg-slate-100 text-slate-600">
                        {RULE_TYPES.find((t) => t.value === rule.rule_type)?.label ?? rule.rule_type}
                      </span>
                    )}
                    {rule.source === 'feedback' && (
                      <span className="text-min text-slate-400">Extracted from video</span>
                    )}
                  </div>
                </>
              )}

              {confirmDeleteId === rule.id && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-min text-amber-900">Remove this expertise entry?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-min font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === rule.id ? 'Removing…' : 'Remove'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-min font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExpertisePage() {
  const { user, session } = useAuth()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [addedAsRules, setAddedAsRules] = useState(new Set())
  // Incrementing this re-triggers the SavedExpertise load after extraction saves
  const [savedRefresh, setSavedRefresh] = useState(0)

  async function handleExtract(e) {
    e.preventDefault()
    const url = youtubeUrl.trim()
    if (!url) { setError('Enter a YouTube URL'); return }
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
      source: 'feedback',
      category: 'expertise',
    })
    if (!err) {
      setAddedAsRules((prev) => new Set([...prev, text]))
      setSavedRefresh((n) => n + 1)
    }
  }

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-8">
      {/* YouTube extraction */}
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
          {error && <p className="text-min text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={extracting}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {extracting ? 'Extracting…' : 'Extract expertise'}
          </button>
        </form>
      </div>

      {/* Extracted results */}
      {result && (
        <div className="space-y-4">
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
            <h3 className="mb-1 text-min font-semibold text-slate-800">Extracted insights</h3>
            <p className="mb-4 text-min text-slate-500">
              Hit &ldquo;Save&rdquo; to add any item to your expertise knowledge below.
            </p>
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
              <p className="mt-4 text-min text-slate-500">
                {addedAsRules.size} item{addedAsRules.size !== 1 ? 's' : ''} saved to your expertise.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Saved expertise CRUD */}
      {user?.id && (
        <SavedExpertise userId={user.id} refreshTrigger={savedRefresh} />
      )}
    </div>
  )
}
