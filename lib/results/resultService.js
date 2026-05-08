import { supabase } from '@/lib/supabase/client'

// Save exam result
export async function saveResult(result) {
  return await supabase
    .from('results')
    .insert([result])
}

// Save answers batch
export async function saveAnswers(answers) {
  return await supabase
    .from('answers')
    .insert(answers)
}
