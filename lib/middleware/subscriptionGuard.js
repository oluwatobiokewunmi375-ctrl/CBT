import { checkSubscription } from '@/lib/billing/subscriptionService'

export async function requireActiveSubscription(email) {
  const sub = await checkSubscription(email)

  if (!sub || sub.status !== 'active') {
    throw new Error('Subscription required')
  }

  return true
}
