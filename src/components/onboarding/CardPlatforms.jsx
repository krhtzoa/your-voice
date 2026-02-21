import {
  Facebook,
  Instagram,
  Linkedin,
  Check,
  Youtube,
} from 'lucide-react'
import OnboardingCard from './OnboardingCard.jsx'

const PLATFORMS = [
  { slug: 'facebook', label: 'Facebook', Icon: Facebook },
  { slug: 'instagram', label: 'Instagram', Icon: Instagram },
  { slug: 'tiktok', label: 'TikTok', Icon: () => null },
  { slug: 'youtube', label: 'YouTube', Icon: Youtube },
  { slug: 'x', label: 'X', Icon: () => null },
  { slug: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
]

function TikTokIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

function XIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const ICON_MAP = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
  x: XIcon,
  linkedin: Linkedin,
}

export default function CardPlatforms({
  formValues,
  setFormValues,
  onBack,
  onNext,
  error,
  saving,
}) {
  const { content_platforms } = formValues
  const selected = new Set(content_platforms ?? [])

  function toggle(slug) {
    setFormValues((p) => {
      const arr = [...(p.content_platforms ?? [])]
      const idx = arr.indexOf(slug)
      if (idx >= 0) arr.splice(idx, 1)
      else arr.push(slug)
      return { ...p, content_platforms: arr }
    })
  }

  return (
    <OnboardingCard
      onBack={onBack}
      onNext={onNext}
      nextLabel="Finish"
      error={error}
      saving={saving}
    >
      <h2 className="text-2xl font-semibold text-slate-800">
        Content Platforms
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Where do you post content? (Select any that apply)
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PLATFORMS.map(({ slug, label }) => {
          const Icon = ICON_MAP[slug] ?? (() => null)
          const isSelected = selected.has(slug)
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 transition-all ${
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
    </OnboardingCard>
  )
}
