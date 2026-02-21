import OnboardingCard from './OnboardingCard.jsx'

const OPTIONS = [
  'Like a teacher',
  'Like a friendly conversation',
  'Like a coach pushing you',
  'Like a performer/storyteller',
  'Neutral / informative',
]

export default function CardToneStyle({
  formValues,
  setFormValues,
  onBack,
  onNext,
  onSkip,
  error,
  saving,
}) {
  const { tone_style } = formValues

  return (
    <OnboardingCard
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
      nextLabel="Next"
      error={error}
      saving={saving}
    >
      <h2 className="text-2xl font-semibold text-slate-800">
        How should this sound?
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Pick one — this sets the voice of your content.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              setFormValues((p) => ({ ...p, tone_style: label }))
            }
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              tone_style === label
                ? 'border-slate-900 bg-slate-100'
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <span className="font-medium text-slate-800">{label}</span>
          </button>
        ))}
      </div>
    </OnboardingCard>
  )
}
