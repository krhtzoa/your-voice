import OnboardingCard from './OnboardingCard.jsx'

const OPTIONS = ['Nothing', 'A little', 'A lot', "They're experts"]

export default function CardAudienceKnowledge({
  formValues,
  setFormValues,
  onBack,
  onNext,
  onSkip,
  error,
  saving,
}) {
  const { audience_knowledge_level } = formValues

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
        How much do they already know about this topic?
      </h2>
      <p className="mt-1 text-min text-slate-600">
        This helps us match the right tone and depth.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              setFormValues((p) => ({ ...p, audience_knowledge_level: label }))
            }
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              audience_knowledge_level === label
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
