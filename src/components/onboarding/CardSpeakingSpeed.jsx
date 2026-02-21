import OnboardingCard from './OnboardingCard.jsx'

const MIN_WPM = 100
const MAX_WPM = 200
const STEP_WPM = 5
const DEFAULT_WPM = 145

export default function CardSpeakingSpeed({
  formValues,
  setFormValues,
  onBack,
  onNext,
  error,
  saving,
}) {
  const wpm = formValues.speaking_speed_wpm ?? DEFAULT_WPM

  function handleChange(e) {
    const val = parseInt(e.target.value, 10)
    setFormValues((p) => ({ ...p, speaking_speed_wpm: val }))
  }

  const hasValue = wpm >= MIN_WPM && wpm <= MAX_WPM

  return (
    <OnboardingCard
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!hasValue}
      nextLabel="Next"
      error={error}
      saving={saving}
    >
      <h2 className="text-2xl font-semibold text-slate-800">
        How fast do you speak for audio, podcast, video content?
      </h2>

      <div className="mt-8">
        <div className="mb-2 flex justify-between text-min font-medium text-slate-500">
          <span>SLOW</span>
          <span>MEDIUM</span>
          <span>FAST</span>
        </div>
        <input
          type="range"
          min={MIN_WPM}
          max={MAX_WPM}
          step={STEP_WPM}
          value={wpm}
          onChange={handleChange}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-700"
          aria-label="Speaking speed in words per minute"
        />
        <p className="mt-3 text-center text-lg font-semibold text-slate-800">
          {wpm} <span className="font-normal text-slate-600">words per minute</span>
        </p>
      </div>
    </OnboardingCard>
  )
}
