import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function SettingsPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    country: '',
    state: '',
    city: '',
  })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })

  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMessage, setEmailMessage] = useState({ type: '', text: '' })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!supabase || !user?.id) return
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, country, state, city')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        setProfile({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          country: data.country ?? '',
          state: data.state ?? '',
          city: data.city ?? '',
        })
      }
      setProfileLoading(false)
    }
    fetchProfile()
  }, [user?.id])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    if (!supabase || !user?.id) return
    setProfileSaving(true)
    setProfileMessage({ type: '', text: '' })
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        country: profile.country.trim() || null,
        state: profile.state.trim() || null,
        city: profile.city.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    setProfileSaving(false)
    if (error) {
      setProfileMessage({ type: 'error', text: error.message })
    } else {
      setProfileMessage({ type: 'success', text: 'Profile saved.' })
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!supabase || !newEmail.trim()) return
    setEmailSaving(true)
    setEmailMessage({ type: '', text: '' })
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailSaving(false)
    if (error) {
      setEmailMessage({ type: 'error', text: error.message })
    } else {
      setEmailMessage({
        type: 'success',
        text: 'Check your new email to confirm the change.',
      })
      setNewEmail('')
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!supabase) return
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMessage({ type: '', text: '' })
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } else {
      setPasswordMessage({ type: 'success', text: 'Password updated.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'
  const labelClass = 'mb-1 block text-min font-medium text-slate-700'
  const sectionClass = 'w-full max-w-[500px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm'

  if (!supabase) {
    return (
      <div className="flex flex-col items-center pt-12 px-6">
        <p className="text-base text-slate-600">
          Add Supabase credentials to .env to use settings.
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

      <h2 className="text-2xl font-semibold text-slate-800">Settings</h2>

      <div className="grid w-full max-w-[1600px] grid-cols-[repeat(auto-fill,minmax(300px,500px))] justify-center gap-8">
        {/* Profile */}
        <section className={sectionClass}>
        <h3 className="text-xl font-medium text-slate-800">Profile</h3>
        <p className="mt-1 text-min text-slate-600">
          Your name and location (optional).
        </p>
        {profileLoading ? (
          <p className="mt-4 text-min text-slate-500">Loading…</p>
        ) : (
          <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className={labelClass}>
                  First name *
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={profile.first_name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, first_name: e.target.value }))
                  }
                  required
                  className={inputClass}
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="last_name" className={labelClass}>
                  Last name *
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={profile.last_name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, last_name: e.target.value }))
                  }
                  required
                  className={inputClass}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>
                Country
              </label>
              <input
                id="country"
                type="text"
                value={profile.country}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, country: e.target.value }))
                }
                className={inputClass}
                placeholder="Country"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="state" className={labelClass}>
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={profile.state}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, state: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="State"
                />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={profile.city}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, city: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="City"
                />
              </div>
            </div>
            {profileMessage.text && (
              <p
                className={`text-min ${
                  profileMessage.type === 'error' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {profileMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}
      </section>

      {/* Change email */}
      <section className={sectionClass}>
        <h3 className="text-xl font-medium text-slate-800">Change email</h3>
        <p className="mt-1 text-min text-slate-600">
          Current: {user?.email}
        </p>
        <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="new_email" className={labelClass}>
              New email
            </label>
            <input
              id="new_email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
              placeholder="new@example.com"
            />
          </div>
          {emailMessage.text && (
            <p
              className={`text-min ${
                emailMessage.type === 'error' ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {emailMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={emailSaving || !newEmail.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {emailSaving ? 'Updating…' : 'Update email'}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className={sectionClass}>
        <h3 className="text-xl font-medium text-slate-800">Change password</h3>
        <p className="mt-1 text-min text-slate-600">
          Use at least 6 characters.
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="new_password" className={labelClass}>
              New password
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          {passwordMessage.text && (
            <p
              className={`text-min ${
                passwordMessage.type === 'error'
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              {passwordMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving || !newPassword || !confirmPassword}
            className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
      </div>
    </div>
  )
}
