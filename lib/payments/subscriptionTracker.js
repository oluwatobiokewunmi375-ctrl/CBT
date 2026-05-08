import { supabase } from '@/lib/supabase/client'

// SAVE PAYMENT RECORD
export async function saveTransaction(data) {
  return await supabase.from('transactions').insert([data])
}

// ACTIVATE SUBSCRIPTION
export async function activateSubscription(schoolId, plan) {
  return await supabase
    .from('subscriptions')
    .update({
      plan,
      status: 'active'
    })
    .eq('school_id', schoolId)
}
