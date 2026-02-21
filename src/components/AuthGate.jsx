import { useAuth } from '../contexts/AuthContext.jsx'
import AuthForm from './AuthForm.jsx'

export default function AuthGate({ children }) {
  const { user, loading, isConfigured } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-min text-slate-600">Loading…</p>
      </div>
    )
  }

  if (isConfigured && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <h1
          className="font-bubbly font-black text-5xl text-slate-800 md:text-6xl"
          style={{
            textShadow:
              '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0 0 6px white, 0 0 12px white',
          }}
        >
          YOUR VOICE
        </h1>
        <p className="mt-4 text-center text-base text-slate-600">
          The personalized content generator that learns who you are
        </p>
        <div className="mt-8">
          <AuthForm />
        </div>
      </div>
    )
  }

  return children
}
