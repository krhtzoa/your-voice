import OnboardingCard from './OnboardingCard.jsx'

export default function CardCreatorType({
  formValues,
  setFormValues,
  onBack,
  onNext,
  error,
  saving,
}) {
  const { is_existing_creator } = formValues
  const hasSelection = is_existing_creator !== null

  return (
    <OnboardingCard
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!hasSelection}
      nextLabel="Next"
      error={error}
      saving={saving}
    >
      <h2 className="text-2xl font-semibold text-slate-800">
        Content Creator Type
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Which best describes you?
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            setFormValues((p) => ({ ...p, is_existing_creator: false }))
          }
          className={`rounded-xl border-2 p-6 text-left transition-all ${
            is_existing_creator === false
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <span className="text-lg font-semibold text-slate-800">
            NEW CONTENT CREATOR
          </span>
          <p className="mt-2 text-min text-slate-600">
            I&apos;m new to content creation
          </p>
        </button>
        <button
          type="button"
          onClick={() =>
            setFormValues((p) => ({ ...p, is_existing_creator: true }))
          }
          className={`rounded-xl border-2 p-6 text-left transition-all ${
            is_existing_creator === true
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <span className="text-lg font-semibold text-slate-800">
            EXISTING CONTENT CREATOR
          </span>
          <p className="mt-2 text-min text-slate-600">
            I already create content
          </p>
        </button>
      </div>
    </OnboardingCard>
  )
}
