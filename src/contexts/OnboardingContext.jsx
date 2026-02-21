import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const TOTAL_ONBOARDING_CARDS = 11

function getInitialCardIndex(profile) {
  if (!profile) return 0
  if (profile.onboarding_completed === true) return -1
  const step = profile.onboarding_step ?? 0
  if (step >= 5) return Math.min(step, TOTAL_ONBOARDING_CARDS - 1)
  const hasName = profile.first_name?.trim() && profile.last_name?.trim()
  if (!hasName) return 0
  if (profile.is_existing_creator == null) return 2
  if (profile.speaking_speed_wpm == null) return 3
  const platforms = profile.content_platforms
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) return 4
  return 5
}

const OnboardingContext = createContext(null)

export function OnboardingProvider({
  children,
  onComplete,
  onColorChange,
  onNavigate,
}) {
  const { user } = useAuth()
  const [cardIndex, setCardIndex] = useState(0)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    country: '',
    state: '',
    city: '',
    is_existing_creator: null,
    speaking_speed_wpm: 145,
    content_platforms: [],
    target_audience: '',
    audience_knowledge_level: null,
    content_goal: null,
    desired_feeling: '',
    experience_background: '',
    tone_style: null,
    favorite_color:
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('your-voice-bg-color') ?? '#f8fafc'
        : '#f8fafc',
  })

  useEffect(() => {
    if (formValues.favorite_color && onColorChange) {
      onColorChange(formValues.favorite_color)
    }
  }, [formValues.favorite_color, onColorChange])

  useEffect(() => {
    if (!supabase || !user?.id) {
      setLoading(false)
      return
    }
    async function fetchProfile() {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (err && err.code !== 'PGRST116') {
        setLoading(false)
        return
      }
      const p = err || !data ? null : data
      setProfile(p)
      let favoriteColor = p?.favorite_color
      if (!favoriteColor) {
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('favorite_color')
          .eq('id', user.id)
          .single()
        favoriteColor = prefs?.favorite_color
      }
      favoriteColor =
        favoriteColor ??
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('your-voice-bg-color') ?? '#f8fafc'
          : '#f8fafc')
      const idx = getInitialCardIndex(p)
      setCardIndex(idx >= 0 ? idx : 0)
      if (p) {
        setFormValues({
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          country: p.country ?? '',
          state: p.state ?? '',
          city: p.city ?? '',
          is_existing_creator: p.is_existing_creator ?? null,
          speaking_speed_wpm: p.speaking_speed_wpm ?? 145,
          content_platforms: Array.isArray(p.content_platforms)
            ? p.content_platforms
            : [],
          target_audience: p.target_audience ?? '',
          audience_knowledge_level: p.audience_knowledge_level ?? null,
          content_goal: p.content_goal ?? null,
          desired_feeling: p.desired_feeling ?? '',
          experience_background: p.experience_background ?? '',
          tone_style: p.tone_style ?? null,
          favorite_color: favoriteColor,
        })
      } else {
        setFormValues((prev) => ({ ...prev, favorite_color: favoriteColor }))
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user?.id])

  const saveFavoriteColorAndAdvance = useCallback(async () => {
    if (!supabase || !user?.id) return
    const color = formValues.favorite_color?.trim() || '#f8fafc'
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('user_preferences').upsert(
      {
        id: user.id,
        favorite_color: color,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setSaving(false)
    if (err) {
      setError('Something went wrong. Please try again.')
      return
    }
    setError('')
    const nextIdx = 1
    setCardIndex(nextIdx)
    onNavigate?.(`/onboarding/${nextIdx + 1}`)
  }, [user?.id, formValues.favorite_color, onNavigate])

  const advance = useCallback(() => {
    setError('')
    setCardIndex((i) => Math.min(i + 1, TOTAL_ONBOARDING_CARDS - 1))
  }, [])

  const goBack = useCallback(() => {
    setError('')
    const prevIdx = Math.max(cardIndex - 1, 0)
    setCardIndex(prevIdx)
    onNavigate?.(`/onboarding/${prevIdx + 1}`)
  }, [cardIndex, onNavigate])

  const setCardIndexFromUrl = useCallback((step) => {
    const idx = Math.max(0, Math.min(TOTAL_ONBOARDING_CARDS - 1, step - 1))
    setCardIndex(idx)
  }, [])

  const saveAndAdvance = useCallback(
    async (payload) => {
      if (!supabase || !user?.id) return
      setSaving(true)
      setError('')
      const nextIdx = Math.min(cardIndex + 1, TOTAL_ONBOARDING_CARDS - 1)
      const { error: err } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          ...payload,
          onboarding_step: nextIdx,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      setSaving(false)
      if (err) {
        setError('Something went wrong. Please try again.')
        return
      }
      setCardIndex(nextIdx)
      onNavigate?.(`/onboarding/${nextIdx + 1}`)
    },
    [user?.id, cardIndex, onNavigate]
  )

  const getCompletePayload = useCallback(() => ({
    first_name: formValues.first_name?.trim() || '',
    last_name: formValues.last_name?.trim() || '',
    country: formValues.country?.trim() || null,
    state: formValues.state?.trim() || null,
    city: formValues.city?.trim() || null,
    is_existing_creator: formValues.is_existing_creator,
    speaking_speed_wpm: formValues.speaking_speed_wpm ?? 145,
    content_platforms: formValues.content_platforms ?? [],
    target_audience: formValues.target_audience?.trim() || null,
    audience_knowledge_level: formValues.audience_knowledge_level || null,
    content_goal: formValues.content_goal || null,
    desired_feeling: formValues.desired_feeling?.trim() || null,
    experience_background: formValues.experience_background?.trim() || null,
    tone_style: formValues.tone_style || null,
    favorite_color: formValues.favorite_color?.trim() || null,
  }), [formValues])

  const completeOnboarding = useCallback(
    async (payloadOverride) => {
      if (!supabase || !user?.id) return
      setSaving(true)
      setError('')
      const base = getCompletePayload()
      const payload = payloadOverride ? { ...base, ...payloadOverride } : base
      const { error: err } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          ...payload,
          onboarding_completed: true,
          onboarding_step: TOTAL_ONBOARDING_CARDS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      setSaving(false)
      if (err) {
        setError('Something went wrong. Please try again.')
        return
      }
      onNavigate?.('/')
      onComplete?.()
    },
    [user?.id, getCompletePayload, onComplete, onNavigate]
  )

  const value = {
    cardIndex,
    setCardIndexFromUrl,
    formValues,
    setFormValues,
    onColorChange,
    profile,
    loading,
    error,
    saving,
    advance,
    saveFavoriteColorAndAdvance,
    goBack,
    saveAndAdvance,
    completeOnboarding,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
