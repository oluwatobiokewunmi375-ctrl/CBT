import { gradeExam, saveResult } from './gradeEngine'
import { supabase } from '@/lib/supabase/client'

// SUBMIT EXAM
export async function submitExam(studentId, examId, answers) {

  // fetch questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)

  // grade exam
  const score = await gradeExam(answers, questions)

  // save result
  return await saveResult({
    student_id: studentId,
    exam_id: examId,
    score,
    total: questions.length
  })
}
