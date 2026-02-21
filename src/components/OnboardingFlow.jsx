import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useOnboarding } from '../contexts/OnboardingContext.jsx'
import CardCreatorType from './onboarding/CardCreatorType.jsx'
import CardNameLocation from './onboarding/CardNameLocation.jsx'
import CardPlatforms from './onboarding/CardPlatforms.jsx'
import CardWelcome from './onboarding/CardWelcome.jsx'

const CARDS = [
  { Component: CardWelcome, key: 'welcome' },
  { Component: CardNameLocation, key: 'name' },
  { Component: CardCreatorType, key: 'creator' },
  { Component: CardPlatforms, key: 'platforms' },
]

export default function OnboardingFlow() {
  const { step } = useParams()
  const {
    cardIndex,
    setCardIndexFromUrl,
    formValues,
    setFormValues,
    error,
    saving,
    saveFavoriteColorAndAdvance,
    goBack,
    saveAndAdvance,
    completeOnboarding,
  } = useOnboarding()

  useEffect(() => {
    const stepNum = parseInt(step, 10)
    if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 4) {
      setCardIndexFromUrl(stepNum)
    }
  }, [step, setCardIndexFromUrl])

  const { Component } = CARDS[cardIndex]

  function handleNext() {
    if (cardIndex === 0) {
      saveFavoriteColorAndAdvance()
      return
    }
    if (cardIndex === 1) {
      saveAndAdvance({
        first_name: formValues.first_name.trim(),
        last_name: formValues.last_name.trim(),
        country: formValues.country?.trim() || null,
        state: formValues.state?.trim() || null,
        city: formValues.city?.trim() || null,
        favorite_color: formValues.favorite_color?.trim() || null,
      })
      return
    }
    if (cardIndex === 2) {
      saveAndAdvance({
        first_name: formValues.first_name.trim(),
        last_name: formValues.last_name.trim(),
        country: formValues.country?.trim() || null,
        state: formValues.state?.trim() || null,
        city: formValues.city?.trim() || null,
        is_existing_creator: formValues.is_existing_creator,
        favorite_color: formValues.favorite_color?.trim() || null,
      })
      return
    }
    if (cardIndex === 3) {
      completeOnboarding()
    }
  }

  return (
    <div className="flex flex-col items-center pt-12 px-6 pb-16">
      <p className="mb-6 text-min text-slate-500">
        Step {cardIndex + 1} of 4
      </p>
      <div className="h-1 w-full max-w-[500px] overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-slate-600 transition-all duration-300"
          style={{ width: `${((cardIndex + 1) / 4) * 100}%` }}
        />
      </div>
      <div className="mt-8 w-full max-w-[500px]">
        <Component
          formValues={formValues}
          setFormValues={setFormValues}
          onBack={goBack}
          onNext={handleNext}
          error={error}
          saving={saving}
        />
      </div>
    </div>
  )
}
