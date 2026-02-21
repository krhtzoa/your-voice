import OnboardingCard from './OnboardingCard.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'

export default function CardDesiredFeeling({
  formValues,
  setFormValues,
  onBack,
  onNext,
  onSkip,
  error,
  saving,
}) {
  const { desired_feeling } = formValues

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
        What feeling should they have at the end?
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Happy, calm, confident, curious, excited, relieved, etc.
      </p>
      <input
        type="text"
        value={desired_feeling ?? ''}
        onChange={(e) =>
          setFormValues((p) => ({ ...p, desired_feeling: e.target.value }))
        }
        placeholder="e.g. confident, inspired, relieved"
        className={`${inputClass} mt-6`}
      />
    </OnboardingCard>
  )
}
