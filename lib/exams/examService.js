import { supabase } from '@/lib/supabase/client'

// Fetch exams from database (PRIMARY SOURCE)
export async function fetchExams(schoolId) {
  return await supabase
    .from('exams')
    .select('*')
    .eq('school_id', schoolId)
}

// Fetch questions for exam
export async function fetchQuestions(examId) {
  return await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
}

// Save attempt
export async function createAttempt(studentId, examId) {
  return await supabase
    .from('attempts')
    .insert([{ student_id: studentId, exam_id: examId }])
}
