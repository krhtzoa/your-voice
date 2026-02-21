import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PLATFORMS, ICON_MAP } from '../lib/platforms.jsx'

const sectionClass =
  'w-full max-w-[500px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    is_existing_creator: null,
    content_platforms: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({ creator: false, platforms: false })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!supabase || !user?.id) {
      setLoading(false)
      return
    }
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_existing_creator, content_platforms, first_name, last_name')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        setProfile({
          is_existing_creator: data.is_existing_creator ?? null,
          content_platforms: Array.isArray(data.content_platforms)
            ? data.content_platforms
            : [],
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user?.id])

  async function saveCreatorType() {
    if (!supabase || !user?.id || profile.is_existing_creator == null) return
    setSaving((s) => ({ ...s, creator: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city')
      .eq('id', user.id)
      .single()
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        first_name: existing?.first_name ?? '',
        last_name: existing?.last_name ?? '',
        country: existing?.country ?? null,
        state: existing?.state ?? null,
        city: existing?.city ?? null,
        is_existing_creator: profile.is_existing_creator,
        content_platforms: profile.content_platforms ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, creator: false }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  async function savePlatforms() {
    if (!supabase || !user?.id) return
    setSaving((s) => ({ ...s, platforms: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city, is_existing_creator')
      .eq('id', user.id)
      .single()
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        first_name: existing?.first_name ?? '',
        last_name: existing?.last_name ?? '',
        country: existing?.country ?? null,
        state: existing?.state ?? null,
        city: existing?.city ?? null,
        is_existing_creator: existing?.is_existing_creator ?? profile.is_existing_creator,
        content_platforms: profile.content_platforms ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, platforms: false }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  function togglePlatform(slug) {
    const arr = [...(profile.content_platforms ?? [])]
    const idx = arr.indexOf(slug)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(slug)
    setProfile((p) => ({ ...p, content_platforms: arr }))
  }

  const selectedPlatforms = new Set(profile.content_platforms ?? [])

  if (!supabase) {
    return (
      <div className="flex flex-col items-center pt-12 px-6">
        <p className="text-base text-slate-600">
          Add Supabase credentials to .env to use profile.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-12 px-6 pb-16">
      <h1
        className="font-bubbly font-black text-5xl text-slate-800 md:text-6xl"
        style={{
          textShadow:
            '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0 0 6px white, 0 0 12px white',
        }}
      >
        YOUR VOICE
      </h1>

      <h2 className="text-2xl font-semibold text-slate-800">Profile</h2>

      <div className="grid w-full max-w-[1600px] grid-cols-[repeat(auto-fill,minmax(300px,500px))] justify-center gap-8">
        {/* Creator Type */}
        <section className={sectionClass}>
          <h3 className="text-xl font-medium text-slate-800">
            Content Creator Type
          </h3>
          <p className="mt-1 text-min text-slate-600">
            Which best describes you?
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setProfile((p) => ({ ...p, is_existing_creator: false }))
              }}
              className={`rounded-xl border-2 p-6 text-left transition-all ${
                profile.is_existing_creator === false
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <span className="text-lg font-semibold text-slate-800">
                NEW CONTENT CREATOR
              </span>
              <p className="mt-2 text-min text-slate-600">
                I&apos;m new to content creation
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setProfile((p) => ({ ...p, is_existing_creator: true }))
              }}
              className={`rounded-xl border-2 p-6 text-left transition-all ${
                profile.is_existing_creator === true
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <span className="text-lg font-semibold text-slate-800">
                EXISTING CONTENT CREATOR
              </span>
              <p className="mt-2 text-min text-slate-600">
                I already create content
              </p>
            </button>
          </div>
          <button
            type="button"
            onClick={saveCreatorType}
            disabled={saving.creator || profile.is_existing_creator == null}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.creator ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* Platforms */}
        <section className={sectionClass}>
          <h3 className="text-xl font-medium text-slate-800">
            Content Platforms
          </h3>
          <p className="mt-1 text-min text-slate-600">
            Where do you post content?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PLATFORMS.map(({ slug, label }) => {
              const Icon = ICON_MAP[slug]
              const isSelected = selectedPlatforms.has(slug)
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => togglePlatform(slug)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  {isSelected ? (
                    <span className="font-bubbly text-4xl font-black text-slate-900">
                      ✓
                    </span>
                  ) : (
                    Icon && (
                      <Icon className="h-8 w-8 text-slate-600" strokeWidth={1.5} />
                    )
                  )}
                  <span className="text-min font-medium text-slate-600">{label}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={savePlatforms}
            disabled={saving.platforms}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.platforms ? 'Saving…' : 'Save'}
          </button>
        </section>
      </div>
    </div>
  )
}
