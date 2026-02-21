import OnboardingCard from './OnboardingCard.jsx'

export default function CardWelcome({
  formValues,
  setFormValues,
  onNext,
  error,
  saving,
}) {
  const color = formValues.favorite_color ?? '#f8fafc'

  return (
    <OnboardingCard
      onNext={onNext}
      showBack={false}
      nextLabel="Get started"
      error={error}
      saving={saving}
    >
      <h2 className="text-2xl font-semibold text-slate-800">Welcome!</h2>
      <p className="mt-4 text-base text-slate-600">
        Tired of AI generated content not reliably getting who you are and what
        you sound like? Spending hours refining content scripts into your voice?
      </p>
      <p className="mt-3 text-base text-slate-600">
        <span className="font-semibold text-slate-800">YOUR VOICE</span> learns
        who you are, saving you hours of polishing so you can focus on doing
        what you love.
      </p>
      <div className="mt-6 flex flex-col items-start gap-3">
        <label
          htmlFor="ob-favorite-color"
          className="text-min font-medium text-slate-700"
        >
          What&apos;s your favourite color right now?
        </label>
        <input
          id="ob-favorite-color"
          type="color"
          value={color}
          onChange={(e) => {
            const hex = e.target.value
            setFormValues((p) => ({ ...p, favorite_color: hex }))
          }}
          className="h-16 w-16 cursor-pointer rounded-full border-4 border-white shadow-xl transition-transform hover:scale-105"
          title="Choose your favourite color"
        />
      </div>
    </OnboardingCard>
  )
}
