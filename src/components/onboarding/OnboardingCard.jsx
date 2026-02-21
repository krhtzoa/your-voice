export default function OnboardingCard({
  children,
  onBack,
  onNext,
  showBack = true,
  nextLabel = 'Next',
  nextDisabled = false,
  error,
  saving,
}) {
  return (
    <div className="w-full max-w-[500px] rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      {children}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex-1">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-min font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Back
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col items-end gap-2">
          <button
            type="button"
            onClick={onNext}
            disabled={saving || nextDisabled}
            className="rounded-lg bg-slate-900 px-4 py-2 text-min font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : nextLabel}
          </button>
          {error && (
            <p className="text-min text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
