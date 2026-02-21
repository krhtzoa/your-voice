import OnboardingCard from './OnboardingCard.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'

export default function CardTargetAudience({
  formValues,
  setFormValues,
  onBack,
  onNext,
  onSkip,
  error,
  saving,
}) {
  const { target_audience } = formValues

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
        Who are you talking to, and/or what industry?
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Example: homeowners, teens, beginners, business owners
      </p>
      <input
        type="text"
        value={target_audience ?? ''}
        onChange={(e) =>
          setFormValues((p) => ({ ...p, target_audience: e.target.value }))
        }
        placeholder="e.g. first-time homebuyers, real estate, fitness beginners"
        className={`${inputClass} mt-6`}
      />
    </OnboardingCard>
  )
}
