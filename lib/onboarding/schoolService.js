import { supabase } from '@/lib/supabase/client'

// CREATE SCHOOL
export async function createSchool(name, ownerId) {
  return await supabase.from('schools').insert([
    {
      name,
      owner_id: ownerId
    }
  ])
}

// GET SCHOOL BY USER
export async function getSchool(userId) {
  return await supabase
    .from('schools')
    .select('*')
    .eq('owner_id', userId)
    .single()
}

// COMPLETE ONBOARDING STEP
export async function completeOnboarding(schoolId) {
  return await supabase
    .from('schools')
    .update({ onboarding_complete: true })
    .eq('id', schoolId)
}
