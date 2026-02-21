import {
  BookOpen,
  Heart,
  Lightbulb,
  Newspaper,
  Smile,
  Sparkles,
} from 'lucide-react'
import OnboardingCard from './OnboardingCard.jsx'

const OPTIONS = [
  { label: 'Teach them something', Icon: BookOpen },
  { label: 'Solve a problem', Icon: Lightbulb },
  { label: 'Entertain them', Icon: Smile },
  { label: 'Inspire or motivate', Icon: Sparkles },
  { label: 'Make them feel understood', Icon: Heart },
  { label: 'Share news or information', Icon: Newspaper },
]

export default function CardContentGoal({
  formValues,
  setFormValues,
  onBack,
  onNext,
  onSkip,
  error,
  saving,
}) {
  const { content_goal } = formValues

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
        What do you want to give them most?
      </h2>
      <p className="mt-1 text-min text-slate-600">
        Pick one — this shapes your content category.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              setFormValues((p) => ({ ...p, content_goal: label }))
            }
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              content_goal === label
                ? 'border-slate-900 bg-slate-100'
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${content_goal === label ? 'text-slate-900' : 'text-slate-500'}`}
              strokeWidth={1.5}
            />
            <span className="font-medium text-slate-800">{label}</span>
          </button>
        ))}
      </div>
    </OnboardingCard>
  )
}
