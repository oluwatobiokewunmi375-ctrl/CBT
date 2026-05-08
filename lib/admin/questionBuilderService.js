import { supabase } from '@/lib/supabase/client'

// ADD QUESTION TO EXAM
export async function addQuestion(question) {
  return await supabase.from('questions').insert([question])
}

// BULK ADD QUESTIONS
export async function addQuestions(questions) {
  return await supabase.from('questions').insert(questions)
}

// GET QUESTIONS BY EXAM
export async function getExamQuestions(examId) {
  return await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
}
