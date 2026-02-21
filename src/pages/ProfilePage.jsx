import { useState, useEffect } from 'react'
import {
  BookOpen,
  Heart,
  Lightbulb,
  Newspaper,
  Smile,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PLATFORMS, ICON_MAP } from '../lib/platforms.jsx'

const CONTENT_GOAL_OPTIONS = [
  { label: 'Teach them something', Icon: BookOpen },
  { label: 'Solve a problem', Icon: Lightbulb },
  { label: 'Entertain them', Icon: Smile },
  { label: 'Inspire or motivate', Icon: Sparkles },
  { label: 'Make them feel understood', Icon: Heart },
  { label: 'Share news or information', Icon: Newspaper },
]

const sectionClass =
  'w-full max-w-[500px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    is_existing_creator: null,
    speaking_speed_wpm: 145,
    content_platforms: [],
    target_audience: '',
    audience_knowledge_level: null,
    content_goal: null,
    desired_feeling: '',
    experience_background: '',
    tone_style: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({
    creator: false,
    speaking: false,
    platforms: false,
    contentAudience: false,
    contentGoals: false,
    contentVoice: false,
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    if (!supabase || !user?.id) {
      setLoading(false)
      return
    }
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_existing_creator, speaking_speed_wpm, content_platforms, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background, tone_style, first_name, last_name')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        const p = {
          is_existing_creator: data.is_existing_creator ?? null,
          speaking_speed_wpm: data.speaking_speed_wpm ?? 145,
          content_platforms: Array.isArray(data.content_platforms)
            ? data.content_platforms
            : [],
          target_audience: data.target_audience ?? '',
          audience_knowledge_level: data.audience_knowledge_level ?? null,
          content_goal: data.content_goal ?? null,
          desired_feeling: data.desired_feeling ?? '',
          experience_background: data.experience_background ?? '',
          tone_style: data.tone_style ?? null,
        }
        setProfile(p)
        setLastSaved(p)
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
      .select('first_name, last_name, country, state, city, speaking_speed_wpm, content_platforms, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background, tone_style')
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
        speaking_speed_wpm: existing?.speaking_speed_wpm ?? profile.speaking_speed_wpm ?? 145,
        content_platforms: existing?.content_platforms ?? profile.content_platforms ?? [],
        target_audience: existing?.target_audience ?? profile.target_audience ?? null,
        audience_knowledge_level: existing?.audience_knowledge_level ?? profile.audience_knowledge_level ?? null,
        content_goal: existing?.content_goal ?? profile.content_goal ?? null,
        desired_feeling: existing?.desired_feeling ?? profile.desired_feeling ?? null,
        experience_background: existing?.experience_background ?? profile.experience_background ?? null,
        tone_style: existing?.tone_style ?? profile.tone_style ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, creator: false }))
    if (!error) setLastSaved((s) => ({ ...s, is_existing_creator: profile.is_existing_creator }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  async function saveSpeakingSpeed() {
    if (!supabase || !user?.id) return
    setSaving((s) => ({ ...s, speaking: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city, is_existing_creator, content_platforms, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background, tone_style')
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
        speaking_speed_wpm: profile.speaking_speed_wpm ?? 145,
        content_platforms: existing?.content_platforms ?? profile.content_platforms ?? [],
        target_audience: existing?.target_audience ?? profile.target_audience ?? null,
        audience_knowledge_level: existing?.audience_knowledge_level ?? profile.audience_knowledge_level ?? null,
        content_goal: existing?.content_goal ?? profile.content_goal ?? null,
        desired_feeling: existing?.desired_feeling ?? profile.desired_feeling ?? null,
        experience_background: existing?.experience_background ?? profile.experience_background ?? null,
        tone_style: existing?.tone_style ?? profile.tone_style ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, speaking: false }))
    if (!error) setLastSaved((s) => ({ ...s, speaking_speed_wpm: profile.speaking_speed_wpm }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  async function savePlatforms() {
    if (!supabase || !user?.id) return
    setSaving((s) => ({ ...s, platforms: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city, is_existing_creator, speaking_speed_wpm, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background, tone_style')
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
        speaking_speed_wpm: existing?.speaking_speed_wpm ?? profile.speaking_speed_wpm ?? 145,
        content_platforms: profile.content_platforms ?? [],
        target_audience: existing?.target_audience ?? profile.target_audience ?? null,
        audience_knowledge_level: existing?.audience_knowledge_level ?? profile.audience_knowledge_level ?? null,
        content_goal: existing?.content_goal ?? profile.content_goal ?? null,
        desired_feeling: existing?.desired_feeling ?? profile.desired_feeling ?? null,
        experience_background: existing?.experience_background ?? profile.experience_background ?? null,
        tone_style: existing?.tone_style ?? profile.tone_style ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, platforms: false }))
    if (!error) setLastSaved((s) => ({ ...s, content_platforms: profile.content_platforms }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  async function saveContentAudience() {
    if (!supabase || !user?.id) return
    setSaving((s) => ({ ...s, contentAudience: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city, is_existing_creator, speaking_speed_wpm, content_platforms, content_goal, desired_feeling, experience_background, tone_style')
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
        speaking_speed_wpm: existing?.speaking_speed_wpm ?? profile.speaking_speed_wpm ?? 145,
        content_platforms: existing?.content_platforms ?? profile.content_platforms ?? [],
        target_audience: profile.target_audience?.trim() || null,
        audience_knowledge_level: profile.audience_knowledge_level || null,
        content_goal: existing?.content_goal ?? profile.content_goal ?? null,
        desired_feeling: existing?.desired_feeling ?? profile.desired_feeling ?? null,
        experience_background: existing?.experience_background ?? profile.experience_background ?? null,
        tone_style: existing?.tone_style ?? profile.tone_style ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, contentAudience: false }))
    if (!error) setLastSaved((s) => ({ ...s, target_audience: profile.target_audience, audience_knowledge_level: profile.audience_knowledge_level }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  async function saveContentGoals() {
    if (!supabase || !user?.id) return
    setSaving((s) => ({ ...s, contentGoals: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city, is_existing_creator, speaking_speed_wpm, content_platforms, target_audience, audience_knowledge_level, tone_style')
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
        speaking_speed_wpm: existing?.speaking_speed_wpm ?? profile.speaking_speed_wpm ?? 145,
        content_platforms: existing?.content_platforms ?? profile.content_platforms ?? [],
        target_audience: existing?.target_audience ?? profile.target_audience ?? null,
        audience_knowledge_level: existing?.audience_knowledge_level ?? profile.audience_knowledge_level ?? null,
        content_goal: profile.content_goal || null,
        desired_feeling: profile.desired_feeling?.trim() || null,
        experience_background: profile.experience_background?.trim() || null,
        tone_style: existing?.tone_style ?? profile.tone_style ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, contentGoals: false }))
    if (!error) setLastSaved((s) => ({ ...s, content_goal: profile.content_goal, desired_feeling: profile.desired_feeling, experience_background: profile.experience_background }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  async function saveContentVoice() {
    if (!supabase || !user?.id) return
    setSaving((s) => ({ ...s, contentVoice: true }))
    setMessage({ type: '', text: '' })
    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, country, state, city, is_existing_creator, speaking_speed_wpm, content_platforms, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background')
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
        speaking_speed_wpm: existing?.speaking_speed_wpm ?? profile.speaking_speed_wpm ?? 145,
        content_platforms: existing?.content_platforms ?? profile.content_platforms ?? [],
        target_audience: existing?.target_audience ?? profile.target_audience ?? null,
        audience_knowledge_level: existing?.audience_knowledge_level ?? profile.audience_knowledge_level ?? null,
        content_goal: existing?.content_goal ?? profile.content_goal ?? null,
        desired_feeling: existing?.desired_feeling ?? profile.desired_feeling ?? null,
        experience_background: existing?.experience_background ?? profile.experience_background ?? null,
        tone_style: profile.tone_style || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving((s) => ({ ...s, contentVoice: false }))
    if (!error) setLastSaved((s) => ({ ...s, tone_style: profile.tone_style }))
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Saved.' })
  }

  const unsavedCreator = lastSaved && profile.is_existing_creator !== lastSaved.is_existing_creator
  const unsavedSpeaking = lastSaved && (profile.speaking_speed_wpm ?? 145) !== (lastSaved.speaking_speed_wpm ?? 145)
  const unsavedPlatforms = lastSaved && JSON.stringify(profile.content_platforms ?? []) !== JSON.stringify(lastSaved.content_platforms ?? [])
  const unsavedAudience = lastSaved && ((profile.target_audience ?? '') !== (lastSaved.target_audience ?? '') || profile.audience_knowledge_level !== lastSaved.audience_knowledge_level)
  const unsavedGoals = lastSaved && ((profile.content_goal ?? null) !== (lastSaved.content_goal ?? null) || (profile.desired_feeling ?? '') !== (lastSaved.desired_feeling ?? '') || (profile.experience_background ?? '') !== (lastSaved.experience_background ?? ''))
  const unsavedVoice = lastSaved && (profile.tone_style ?? null) !== (lastSaved.tone_style ?? null)

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
          {unsavedCreator && (
            <p className="mt-4 text-min font-medium text-amber-600">
              Hit this button to save your change!
            </p>
          )}
          <button
            type="button"
            onClick={saveCreatorType}
            disabled={saving.creator || profile.is_existing_creator == null}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.creator ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* Speaking Speed */}
        <section className={sectionClass}>
          <h3 className="text-xl font-medium text-slate-800">
            How fast do you speak for audio, podcast, video content?
          </h3>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-min font-medium text-slate-500">
              <span>SLOW</span>
              <span>MEDIUM</span>
              <span>FAST</span>
            </div>
            <input
              type="range"
              min={100}
              max={200}
              step={5}
              value={profile.speaking_speed_wpm ?? 145}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  speaking_speed_wpm: parseInt(e.target.value, 10),
                }))
              }
              className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-700"
              aria-label="Speaking speed in words per minute"
            />
            <p className="mt-2 text-center text-lg font-semibold text-slate-800">
              {profile.speaking_speed_wpm ?? 145}{' '}
              <span className="font-normal text-slate-600">words per minute</span>
            </p>
          </div>
          {unsavedSpeaking && (
            <p className="mt-4 text-min font-medium text-amber-600">
              Hit this button to save your change!
            </p>
          )}
          <button
            type="button"
            onClick={saveSpeakingSpeed}
            disabled={saving.speaking}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.speaking ? 'Saving…' : 'Save'}
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
          {unsavedPlatforms && (
            <p className="mt-4 text-min font-medium text-amber-600">
              Hit this button to save your change!
            </p>
          )}
          <button
            type="button"
            onClick={savePlatforms}
            disabled={saving.platforms}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.platforms ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* Content Preferences – Audience */}
        <section className={sectionClass}>
          <h3 className="text-xl font-medium text-slate-800">
            Your Audience
          </h3>
          <p className="mt-1 text-min text-slate-600">
            Who are you creating for?
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-min font-medium text-slate-700">
                Who are you talking to, and/or what industry?
              </label>
              <input
                type="text"
                value={profile.target_audience ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, target_audience: e.target.value }))
                }
                placeholder="e.g. homeowners, real estate, teens, beginners"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-min font-medium text-slate-700">
                How much do they already know?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Nothing', 'A little', 'A lot', "They're experts"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, audience_knowledge_level: label }))
                    }
                    className={`rounded-lg border-2 px-3 py-2 text-min font-medium transition-all ${
                      profile.audience_knowledge_level === label
                        ? 'border-slate-900 bg-slate-100'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {unsavedAudience && (
            <p className="mt-4 text-min font-medium text-amber-600">
              Hit this button to save your change!
            </p>
          )}
          <button
            type="button"
            onClick={saveContentAudience}
            disabled={saving.contentAudience}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.contentAudience ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* Content Preferences – Goals & You */}
        <section className={sectionClass}>
          <h3 className="text-xl font-medium text-slate-800">
            Goals & Your Background
          </h3>
          <p className="mt-1 text-min text-slate-600">
            What you want to give them and what you bring.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-min font-medium text-slate-700">
                What do you want to give them most?
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONTENT_GOAL_OPTIONS.map(({ label, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, content_goal: label }))
                    }
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left text-min font-medium transition-all ${
                      profile.content_goal === label
                        ? 'border-slate-900 bg-slate-100'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${profile.content_goal === label ? 'text-slate-900' : 'text-slate-500'}`}
                      strokeWidth={1.5}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-min font-medium text-slate-700">
                What feeling should they have at the end?
              </label>
              <input
                type="text"
                value={profile.desired_feeling ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, desired_feeling: e.target.value }))
                }
                placeholder="e.g. confident, inspired, relieved"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-min font-medium text-slate-700">
                What experience or knowledge do you bring?
              </label>
              <textarea
                value={profile.experience_background ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    experience_background: e.target.value,
                  }))
                }
                placeholder="Work, life experience, training, story, perspective"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>
          {unsavedGoals && (
            <p className="mt-4 text-min font-medium text-amber-600">
              Hit this button to save your change!
            </p>
          )}
          <button
            type="button"
            onClick={saveContentGoals}
            disabled={saving.contentGoals}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.contentGoals ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* Content Preferences – Voice */}
        <section className={sectionClass}>
          <h3 className="text-xl font-medium text-slate-800">
            Voice
          </h3>
          <p className="mt-1 text-min text-slate-600">
            How should your content sound?
          </p>
          <div className="mt-4">
            <label className="mb-2 block text-min font-medium text-slate-700">
              How should this sound?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Like a teacher',
                'Like a friendly conversation',
                'Like a coach pushing you',
                'Like a performer/storyteller',
                'Neutral / informative',
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({ ...p, tone_style: label }))
                  }
                  className={`rounded-lg border-2 px-3 py-2 text-min font-medium transition-all ${
                    profile.tone_style === label
                      ? 'border-slate-900 bg-slate-100'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {unsavedVoice && (
            <p className="mt-4 text-min font-medium text-amber-600">
              Hit this button to save your change!
            </p>
          )}
          <button
            type="button"
            onClick={saveContentVoice}
            disabled={saving.contentVoice}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving.contentVoice ? 'Saving…' : 'Save'}
          </button>
        </section>
      </div>
    </div>
  )
}
