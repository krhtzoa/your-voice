import { COUNTRIES, STATES_BY_COUNTRY } from '../../lib/locationData.js'
import OnboardingCard from './OnboardingCard.jsx'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500'
const labelClass = 'mb-1 block text-min font-medium text-slate-700'

export default function CardNameLocation({
  formValues,
  setFormValues,
  onBack,
  onNext,
  error,
  saving,
}) {
  const { first_name, last_name, country, state, city } = formValues
  const states = country ? (STATES_BY_COUNTRY[country] ?? []) : []
  const canNext = first_name?.trim() && last_name?.trim()

  return (
    <OnboardingCard
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!canNext}
      nextLabel="Next"
      error={error}
      saving={saving}
    >
      <h2 className="text-2xl font-semibold text-slate-800">Name & Location</h2>
      <p className="mt-1 text-min text-slate-600">
        Tell us a bit about yourself.
      </p>
      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ob-first_name" className={labelClass}>
              First name *
            </label>
            <input
              id="ob-first_name"
              type="text"
              value={first_name}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, first_name: e.target.value }))
              }
              required
              className={inputClass}
              placeholder="First name"
            />
          </div>
          <div>
            <label htmlFor="ob-last_name" className={labelClass}>
              Last name *
            </label>
            <input
              id="ob-last_name"
              type="text"
              value={last_name}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, last_name: e.target.value }))
              }
              required
              className={inputClass}
              placeholder="Last name"
            />
          </div>
        </div>
        <div>
          <label htmlFor="ob-country" className={labelClass}>
            Country
          </label>
          <select
            id="ob-country"
            value={country}
            onChange={(e) =>
              setFormValues((p) => ({
                ...p,
                country: e.target.value,
                state: '',
              }))
            }
            className={inputClass}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {country && (
          <div>
            <label htmlFor="ob-state" className={labelClass}>
              State / Province
            </label>
            <select
              id="ob-state"
              value={state}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, state: e.target.value }))
              }
              className={inputClass}
            >
              <option value="">Select state</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="ob-city" className={labelClass}>
            City
          </label>
          <input
            id="ob-city"
            type="text"
            value={city}
            onChange={(e) =>
              setFormValues((p) => ({ ...p, city: e.target.value }))
            }
            className={inputClass}
            placeholder="City"
          />
        </div>
      </div>
    </OnboardingCard>
  )
}
