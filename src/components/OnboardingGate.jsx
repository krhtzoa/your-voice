import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { OnboardingProvider } from '../contexts/OnboardingContext.jsx'
import OnboardingFlow from './OnboardingFlow.jsx'

export default function OnboardingGate({
  onColorChange,
  onColorUpdate,
  homeElement,
  profileElement,
  rulesElement,
  accountElement,
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    if (!supabase || !user?.id) {
      setLoading(false)
      return
    }
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, favorite_color')
      .eq('id', user.id)
      .single()
    let favoriteColor = profileData?.favorite_color
    if (!favoriteColor) {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('favorite_color')
        .eq('id', user.id)
        .single()
      favoriteColor = prefs?.favorite_color
    }
    if (error && error.code !== 'PGRST116') {
      setProfile(null)
    } else {
      setProfile(profileData ?? null)
      if (favoriteColor && onColorChange) {
        onColorChange(favoriteColor)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [user?.id])

  useEffect(() => {
    if (
      !loading &&
      profile?.onboarding_completed !== true &&
      user &&
      location.pathname === '/'
    ) {
      navigate('/onboarding/1', { replace: true })
    }
  }, [loading, profile?.onboarding_completed, user, navigate, location.pathname])

  if (!supabase || !user) {
    return (
      <Routes>
        <Route path="/" element={homeElement} />
        <Route path="/profile" element={profileElement} />
        <Route path="/rules" element={rulesElement} />
        <Route path="/account" element={accountElement} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-min text-slate-500">Loading…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          profile?.onboarding_completed ? (
            homeElement
          ) : (
            <Navigate to="/onboarding/1" replace />
          )
        }
      />
      <Route
        path="/onboarding/:step"
        element={
          profile?.onboarding_completed ? (
            <Navigate to="/" replace />
          ) : (
            <OnboardingProvider
              onComplete={fetchProfile}
              onColorChange={onColorChange}
              onNavigate={navigate}
            >
              <OnboardingFlow />
            </OnboardingProvider>
          )
        }
      />
      <Route path="/profile" element={profileElement} />
      <Route path="/rules" element={rulesElement} />
      <Route path="/account" element={accountElement} />
    </Routes>
  )
}
