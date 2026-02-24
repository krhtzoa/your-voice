import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  fetchRulesByCategory,
  createRule,
  updateRule,
  deleteRule,
  RULE_TYPES,
} from '../lib/voiceRules.js'

const sectionClass =
  'w-full max-w-[500px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm'

const BADGE_CLASSES = {
  avoid: 'bg-amber-100 text-amber-800',
  prefer: 'bg-emerald-100 text-emerald-800',
  never: 'bg-red-100 text-red-800',
  tone: 'bg-slate-100 text-slate-700',
  style: 'bg-slate-100 text-slate-700',
  delivery: 'bg-slate-100 text-slate-700',
  phrasing: 'bg-slate-100 text-slate-700',
  speech_patterns: 'bg-slate-100 text-slate-700',
  non_negotiables: 'bg-slate-100 text-slate-700',
  general: 'bg-slate-100 text-slate-700',
}

function getRuleLabel(value) {
  return RULE_TYPES.find((t) => t.value === value)?.label ?? value
}

export default function RulesPage() {
  const { user } = useAuth()
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
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const loadRules = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    const { data, error: err } = await fetchRulesByCategory(user.id, 'voice')
    if (err) {
      setError(err.message)
      setRules([])
    } else {
      setRules(data ?? [])
      setError('')
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    loadRules()
  }, [user?.id, loadRules])

  async function handleAdd(e) {
    e.preventDefault()
    const content = addContent.trim()
    if (!content || !user?.id) return
    setAdding(true)
    setError('')
    const { error: err } = await createRule(user.id, { content, rule_type: addType })
    setAdding(false)
    if (err) {
      setError(err.message)
      return
    }
    setAddContent('')
    setAddType('general')
    loadRules()
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
    if (!editingId || !user?.id) return
    setSavingId(editingId)
    setError('')
    const { error: err } = await updateRule(user.id, editingId, {
      content: editContent.trim(),
      rule_type: editType,
    })
    setSavingId(null)
    if (err) {
      setError(err.message)
      return
    }
    setEditingId(null)
    setEditContent('')
    setEditType('general')
    loadRules()
  }

  function requestDelete(ruleId) {
    setConfirmDeleteId(ruleId)
  }

  function cancelDelete() {
    setConfirmDeleteId(null)
  }

  async function handleDelete(ruleId) {
    if (!user?.id || !ruleId) return
    setDeletingId(ruleId)
    setError('')
    const { error: err } = await deleteRule(user.id, ruleId)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (err) {
      setError(err.message)
      return
    }
    loadRules()
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-min text-slate-500">Loading…</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-min text-slate-500">Loading rules…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-12 px-6 pb-16">
      <div className={sectionClass}>
        <h2 className="mb-1 text-lg font-semibold text-slate-800">Add a voice rule</h2>
        <p className="mb-4 text-min text-slate-500">
          Communication style, tone, phrasing, and delivery rules. For subject-matter expertise, go to the Expertise page.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div>
            <label htmlFor="add-content" className="mb-1 block text-min font-medium text-slate-700">
              Rule content
            </label>
            <textarea
              id="add-content"
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="e.g., Never use scare tactics"
              rows={3}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label htmlFor="add-type" className="mb-1 block text-min font-medium text-slate-700">
              Type
            </label>
            <select
              id="add-type"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {RULE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding || !addContent.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Rule'}
          </button>
        </form>
      </div>

      {error && (
        <p className="w-full max-w-[500px] text-min text-red-600">{error}</p>
      )}

      <div className="w-full max-w-[500px]">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Your voice &amp; style rules</h2>
        {rules.length === 0 ? (
          <div className={sectionClass}>
            <p className="mb-4 text-base text-slate-600">
              Your voice rules help the AI sound like you. Add your first rule to get started.
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('add-content')?.focus()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800"
            >
              Add your first rule
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm"
              >
                {editingId === rule.id ? (
                  <form onSubmit={handleSaveEdit} className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      {RULE_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
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
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="flex-1 text-base text-slate-800">{rule.content}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(rule)}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(rule.id)}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-min font-medium ${
                          BADGE_CLASSES[rule.rule_type] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getRuleLabel(rule.rule_type)}
                      </span>
                      {rule.source === 'feedback' && (
                        <span className="text-min text-slate-500">From feedback</span>
                      )}
                    </div>
                  </>
                )}
                {confirmDeleteId === rule.id && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-min text-amber-900">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        disabled={deletingId === rule.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-min font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === rule.id ? 'Deleting…' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelDelete}
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
    </div>
  )
}
