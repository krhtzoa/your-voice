import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { ICON_MAP, LABEL_MAP } from '../lib/platforms.jsx'

const MIN_DURATION = 20
const MAX_DURATION = 180
const STEP = 10

function formatDuration(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60} min`
  }
  return `${seconds} sec`
}

export default function HomePage() {
  const { user } = useAuth()
  const [contentPlatforms, setContentPlatforms] = useState([])
  const [platformsLoading, setPlatformsLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [duration, setDuration] = useState(60)
  const [prompt, setPrompt] = useState('')

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
                        ? 'border-slate-900 bg-slate-100'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5 text-slate-600" strokeWidth={1.5} />}
                    <span className="text-min font-medium text-slate-800">{label}</span>
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
        <div>
          <label
            htmlFor="content-duration"
            className="mb-2 block text-min font-medium text-slate-700"
          >
            How long is the content?
          </label>
          <div className="flex items-center gap-4">
            <input
              id="content-duration"
              type="range"
              min={MIN_DURATION}
              max={MAX_DURATION}
              step={STEP}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-2 w-full flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-700"
            />
            <span className="min-w-[4rem] text-min font-medium text-slate-700">
              {formatDuration(duration)}
            </span>
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
      </div>
    </div>
  )
}
