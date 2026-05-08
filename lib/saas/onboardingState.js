export function setOnboardingStep(step) {
  localStorage.setItem('onboarding_step', step)
}

export function getOnboardingStep() {
  return localStorage.getItem('onboarding_step')
}

export function completeOnboarding() {
  localStorage.setItem('onboarding_complete', 'true')
}
