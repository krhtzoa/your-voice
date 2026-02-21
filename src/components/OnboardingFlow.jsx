import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useOnboarding } from '../contexts/OnboardingContext.jsx'
import CardAudienceKnowledge from './onboarding/CardAudienceKnowledge.jsx'
import CardContentGoal from './onboarding/CardContentGoal.jsx'
import CardCreatorType from './onboarding/CardCreatorType.jsx'
import CardDesiredFeeling from './onboarding/CardDesiredFeeling.jsx'
import CardExperienceBackground from './onboarding/CardExperienceBackground.jsx'
import CardNameLocation from './onboarding/CardNameLocation.jsx'
import CardPlatforms from './onboarding/CardPlatforms.jsx'
import CardSpeakingSpeed from './onboarding/CardSpeakingSpeed.jsx'
import CardTargetAudience from './onboarding/CardTargetAudience.jsx'
import CardToneStyle from './onboarding/CardToneStyle.jsx'
import CardWelcome from './onboarding/CardWelcome.jsx'

const CARDS = [
  { Component: CardWelcome, key: 'welcome' },
  { Component: CardNameLocation, key: 'name' },
  { Component: CardCreatorType, key: 'creator' },
  { Component: CardSpeakingSpeed, key: 'speaking' },
  { Component: CardPlatforms, key: 'platforms' },
  { Component: CardTargetAudience, key: 'targetAudience' },
  { Component: CardAudienceKnowledge, key: 'audienceKnowledge' },
  { Component: CardContentGoal, key: 'contentGoal' },
  { Component: CardDesiredFeeling, key: 'desiredFeeling' },
  { Component: CardExperienceBackground, key: 'experienceBackground' },
  { Component: CardToneStyle, key: 'toneStyle' },
]

const TOTAL_CARDS = CARDS.length

function basePayload(formValues) {
  return {
    first_name: formValues.first_name?.trim() || '',
    last_name: formValues.last_name?.trim() || '',
    country: formValues.country?.trim() || null,
    state: formValues.state?.trim() || null,
    city: formValues.city?.trim() || null,
    is_existing_creator: formValues.is_existing_creator,
    speaking_speed_wpm: formValues.speaking_speed_wpm ?? 145,
    content_platforms: formValues.content_platforms ?? [],
    favorite_color: formValues.favorite_color?.trim() || null,
  }
}

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
    if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= TOTAL_CARDS) {
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
      saveAndAdvance({ ...basePayload(formValues) })
      return
    }
    if (cardIndex === 2) {
      saveAndAdvance({ ...basePayload(formValues) })
      return
    }
    if (cardIndex === 3) {
      saveAndAdvance({ ...basePayload(formValues) })
      return
    }
    if (cardIndex === 4) {
      saveAndAdvance({ ...basePayload(formValues) })
      return
    }
    if (cardIndex >= 5 && cardIndex <= 9) {
      const contentPayload = {
        target_audience: formValues.target_audience?.trim() || null,
        audience_knowledge_level: formValues.audience_knowledge_level || null,
        content_goal: formValues.content_goal || null,
        desired_feeling: formValues.desired_feeling?.trim() || null,
        experience_background: formValues.experience_background?.trim() || null,
        tone_style: formValues.tone_style || null,
      }
      saveAndAdvance({ ...basePayload(formValues), ...contentPayload })
      return
    }
    if (cardIndex === 10) {
      completeOnboarding()
    }
  }

  function handleSkip() {
    const skipFieldMap = {
      5: 'target_audience',
      6: 'audience_knowledge_level',
      7: 'content_goal',
      8: 'desired_feeling',
      9: 'experience_background',
      10: 'tone_style',
    }
    const field = skipFieldMap[cardIndex]
    const contentPayload = {
      target_audience: formValues.target_audience?.trim() || null,
      audience_knowledge_level: formValues.audience_knowledge_level || null,
      content_goal: formValues.content_goal || null,
      desired_feeling: formValues.desired_feeling?.trim() || null,
      experience_background: formValues.experience_background?.trim() || null,
      tone_style: formValues.tone_style || null,
    }
    if (field) contentPayload[field] = null
    const payload = { ...basePayload(formValues), ...contentPayload }
    if (cardIndex === 10) {
      completeOnboarding(contentPayload)
    } else {
      saveAndAdvance(payload)
    }
  }

  const showSkip = cardIndex >= 5 && cardIndex <= 10

  return (
    <div className="flex flex-col items-center pt-12 px-6 pb-16">
      <p className="mb-6 text-min text-slate-500">
        Step {cardIndex + 1} of {TOTAL_CARDS}
      </p>
      <div className="h-1 w-full max-w-[500px] overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-slate-600 transition-all duration-300"
          style={{ width: `${((cardIndex + 1) / TOTAL_CARDS) * 100}%` }}
        />
      </div>
      <div className="mt-8 w-full max-w-[500px]">
        <Component
          formValues={formValues}
          setFormValues={setFormValues}
          onBack={goBack}
          onNext={handleNext}
          onSkip={showSkip ? handleSkip : undefined}
          error={error}
          saving={saving}
        />
      </div>
    </div>
  )
}
