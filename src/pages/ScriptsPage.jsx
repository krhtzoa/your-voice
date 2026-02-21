import { useState, useEffect } from 'react'
import { fetchScripts } from '../lib/scripts.js'
import { LABEL_MAP } from '../lib/platforms.jsx'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchScripts()
        setScripts(data)
      } catch (err) {
        setError(err.message || 'Failed to load scripts')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-slate-500">Loading scripts…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-12">
      <h1 className="font-bubbly text-3xl font-black text-slate-800">Scripts</h1>
      <p className="mt-2 text-slate-600">
        Your saved scripts from the home page.
      </p>

      {scripts.length === 0 ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white/80 p-8 text-center">
          <p className="text-slate-600">No scripts yet.</p>
          <p className="mt-2 text-min text-slate-500">
            Create content on the Home page, then save it here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {scripts.map((script) => {
            const isExpanded = expandedId === script.id
            const preview = script.content.slice(0, 120)
            const hasMore = script.content.length > 120
            return (
              <li
                key={script.id}
                className="rounded-xl border border-slate-200 bg-white/95 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {script.prompt && (
                      <p className="mb-2 text-min font-medium text-slate-600 line-clamp-2">
                        “{script.prompt}”
                      </p>
                    )}
                    <p className="text-min text-slate-500">
                      {script.platform && (LABEL_MAP[script.platform] ?? script.platform)}
                      {script.platform && script.duration_seconds && ' · '}
                      {script.duration_seconds && `${script.duration_seconds}s`}
                      {script.created_at && ` · ${formatDate(script.created_at)}`}
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-base text-slate-700">
                      {isExpanded ? script.content : preview}
                      {!isExpanded && hasMore && '…'}
                    </pre>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : script.id)}
                        className="mt-2 text-min font-medium text-slate-600 underline hover:text-slate-800"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
