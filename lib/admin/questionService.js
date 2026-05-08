import { supabase } from '@/lib/supabase/client'

// ADD QUESTION
export async function addQuestion(data) {
  return await supabase.from('questions').insert([data])
}

// GET QUESTIONS BY EXAM
export async function getQuestions(examId) {
  return await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
}
