import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { ICON_MAP, LABEL_MAP } from '../lib/platforms.jsx'
import { createContent } from '../lib/createContentApi.js'
import { saveScript } from '../lib/scripts.js'
import { submitFeedback } from '../lib/feedbackApi.js'

const MIN_DURATION = 20
const MAX_DURATION = 180
const STEP = 10

function formatDuration(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60} min`
  }
  return `${seconds} sec`
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-12" aria-label="Loading">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600" />
    </div>
  )
}

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Okay', 4: 'Good', 5: 'Awesome!' }

export default function HomePage() {
  const { user, session } = useAuth()
  const [contentPlatforms, setContentPlatforms] = useState([])
  const [platformsLoading, setPlatformsLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [duration, setDuration] = useState(60)
  const [prompt, setPrompt] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [rating, setRating] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!supabase || !user?.id) {
      setPlatformsLoading(false)
      return
    }
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('content_platforms')
        .eq('id', user.id)
        .single()
      const platforms = Array.isArray(data?.content_platforms)
        ? data.content_platforms
        : []
      setContentPlatforms(platforms)
      if (platforms.length === 1) {
        setSelectedPlatform(platforms[0])
      } else if (platforms.length > 1) {
        setSelectedPlatform((prev) => (prev && platforms.includes(prev) ? prev : null))
      } else {
        setSelectedPlatform(null)
      }
      setPlatformsLoading(false)
    }
    fetchProfile()
  }, [user?.id])

  const hasMultiple = contentPlatforms.length > 1
  const hasOne = contentPlatforms.length === 1
  const showScript = !!generatedContent

  async function handleCreate() {
    if (!prompt.trim()) return
    setCreating(true)
    setCreateError('')
    setGeneratedContent('')
    setSaveSuccess(false)
    try {
      const { content } = await createContent({
        prompt: prompt.trim(),
        duration,
        platform: selectedPlatform ?? undefined,
        accessToken: session?.access_token,
      })
      setGeneratedContent(content)
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      setCreateError(msg.includes('401') || msg.toLowerCase().includes('unauthorized') ? 'Please log in to create content.' : msg)
    } finally {
      setCreating(false)
    }
  }

  async function handleSave() {
    if (!generatedContent) return
    setSaving(true)
    setSaveSuccess(false)
    try {
      await saveScript({
        content: generatedContent,
        prompt: prompt.trim() || undefined,
        platform: selectedPlatform ?? undefined,
        durationSeconds: duration,
      })
      setSaveSuccess(true)
    } catch (err) {
      setCreateError(err.message || 'Failed to save script')
    } finally {
      setSaving(false)
    }
  }

  function handleCreateAnother() {
    setGeneratedContent('')
    setSaveSuccess(false)
    setCreateError('')
    setRating(null)
    setFeedbackText('')
    setToast(null)
  }

  async function handleFeedbackSubmit() {
    if (!feedbackText.trim() || !generatedContent) return
    setFeedbackSubmitting(true)
    setCreateError('')
    try {
      const { rulesAdded } = await submitFeedback({
        feedbackText: feedbackText.trim(),
        scriptContent: generatedContent,
        accessToken: session?.access_token,
      })
      setToast({ rulesAdded })
      setFeedbackText('')
    } catch (err) {
      setCreateError(err.message || 'Failed to submit feedback')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center pt-12 px-6 pb-16">
      <h1
        className="font-bubbly font-black text-6xl md:text-8xl lg:text-9xl text-slate-800 tracking-tight"
        style={{
          textShadow:
            '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0 0 6px white, 0 0 12px white',
        }}
      >
        YOUR VOICE
      </h1>
      <p className="mt-6 text-center text-base text-slate-600">
        The personalized content generator that learns who you are
      </p>

      <div className="mt-12 w-full max-w-[600px] space-y-6">
        {showScript ? (
          <>
            {/* Script at top */}
            <div className="rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-800">Your script</h3>
              <pre className="whitespace-pre-wrap font-sans text-base text-slate-700">
                {generatedContent}
              </pre>
            </div>

            {/* Rating */}
            <div className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <p className="mb-3 text-min font-medium text-slate-700">How was this script?</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`rounded-lg border-2 px-4 py-2 text-min font-medium transition-all ${
                      rating === n
                        ? 'border-slate-900 bg-slate-200 ring-2 ring-slate-900/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {n} ★ {RATING_LABELS[n]}
                  </button>
                ))}
              </div>
              {rating !== null && rating < 5 && (
                <div className="mt-4">
                  <label htmlFor="feedback-input" className="mb-2 block text-min font-medium text-slate-700">
                    What could we improve?
                  </label>
                  <textarea
                    id="feedback-input"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe what you didn't like..."
                    rows={3}
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <p className="mb-2 text-[0.8125rem] text-slate-500">
                    Submit so we can learn how to improve.
                  </p>
                  <button
                    type="button"
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting || !feedbackText.trim()}
                    className="rounded-xl bg-slate-700 px-6 py-2.5 font-medium text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {feedbackSubmitting ? 'Submitting…' : 'Submit feedback'}
                  </button>
                </div>
              )}
            </div>

            {/* Actions at bottom */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-slate-900 px-8 py-5 font-bubbly text-xl font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'SAVE SCRIPT'}
              </button>
              <button
                type="button"
                onClick={handleCreateAnother}
                className="w-full rounded-xl border-2 border-slate-300 bg-white/80 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Create another
              </button>
              <p className="text-center text-min text-slate-500">
                <Link to="/scripts" className="underline hover:text-slate-700">
                  View all scripts
                </Link>
              </p>
            </div>
          </>
        ) : creating ? (
          <div className="rounded-xl border border-slate-200 bg-white/95 p-8 shadow-sm">
            <p className="text-center text-slate-600">Generating your script…</p>
            <LoadingDots />
          </div>
        ) : (
          <>
            {/* What are we making? */}
            <div>
              <label className="mb-2 block text-min font-medium text-slate-700">
                What are we making?
              </label>
              {platformsLoading ? (
                <p className="text-min text-slate-500">Loading…</p>
              ) : contentPlatforms.length === 0 ? (
                <p className="text-min text-slate-500">
                  <Link to="/profile" className="underline hover:text-slate-700">
                    Add platforms in your profile
                  </Link>
                  {' to get started.'}
                </p>
              ) : hasOne ? (
                <div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    {(() => {
                      const slug = contentPlatforms[0]
                      const Icon = ICON_MAP[slug]
                      const label = LABEL_MAP[slug] ?? slug
                      return (
                        <>
                          {Icon && <Icon className="h-5 w-5 text-slate-600" strokeWidth={1.5} />}
                          <span className="font-medium text-slate-800">{label}</span>
                        </>
                      )
                    })()}
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] text-slate-500">
                    (<Link to="/profile" className="underline hover:text-slate-600">edit profile to add more</Link>)
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {contentPlatforms.map((slug) => {
                    const Icon = ICON_MAP[slug]
                    const label = LABEL_MAP[slug] ?? slug
                    const isSelected = selectedPlatform === slug
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => setSelectedPlatform(slug)}
                        className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-slate-200 ring-2 ring-slate-900/30 shadow-md'
                            : 'border-slate-200 bg-white/50 opacity-80 hover:bg-white/80 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        {Icon && (
                          <Icon
                            className={`h-5 w-5 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}
                            strokeWidth={1.5}
                          />
                        )}
                        <span
                          className={`text-min font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}
                        >
                          {label}
                        </span>
                      </button>
                    )
                  })}
                  <p className="mt-1.5 w-full text-[0.8125rem] text-slate-500">
                    (<Link to="/profile" className="underline hover:text-slate-600">edit profile to add more</Link>)
                  </p>
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
              <label
                htmlFor="content-duration"
                className="mb-3 block text-min font-semibold text-slate-800"
              >
                How long is the content?
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[0.75rem] font-medium text-slate-500">
                  <span>{formatDuration(MIN_DURATION)}</span>
                  <span>{formatDuration(MAX_DURATION)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    id="content-duration"
                    type="range"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    step={STEP}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="duration-slider flex-1"
                  />
                  <span className="min-w-[5rem] rounded-full bg-slate-800 px-4 py-2 text-center font-bubbly text-lg font-bold text-white shadow-md ring-2 ring-slate-700/50">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label
                htmlFor="content-prompt"
                className="mb-2 block text-min font-medium text-slate-700"
              >
                Prompt for your content
              </label>
              <textarea
                id="content-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt here..."
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            {/* CREATE! button */}
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !prompt.trim()}
              className="w-full rounded-2xl bg-slate-900 px-8 py-5 font-bubbly text-2xl font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-900"
            >
              CREATE!
            </button>
          </>
        )}

        {createError && (
          <p className="text-min text-red-600">{createError}</p>
        )}

        {/* Toast: rules added */}
        {toast && toast.rulesAdded > 0 && (
          <div
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg"
            role="status"
          >
            <p className="text-min font-medium text-slate-800">
              We added {toast.rulesAdded} new rule{toast.rulesAdded !== 1 ? 's' : ''} from your feedback.
            </p>
            <Link
              to="/rules"
              onClick={() => setToast(null)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white hover:bg-slate-800"
            >
              View rules
            </Link>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-min text-slate-600 hover:bg-slate-100"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
