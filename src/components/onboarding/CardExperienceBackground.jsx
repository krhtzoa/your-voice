import OnboardingCard from './OnboardingCard.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'

export default function CardExperienceBackground({
  formValues,
  setFormValues,
  onBack,
  onNext,
  onSkip,
  error,
  saving,
}) {
  const { experience_background } = formValues

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
        What experience or knowledge do you bring?
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Work, life experience, training, story, perspective
      </p>
      <textarea
        value={experience_background ?? ''}
        onChange={(e) =>
          setFormValues((p) => ({
            ...p,
            experience_background: e.target.value,
          }))
        }
        placeholder="e.g. 10 years in real estate, overcame anxiety, certified coach"
        rows={4}
        className={`${inputClass} mt-6`}
      />
    </OnboardingCard>
  )
}
