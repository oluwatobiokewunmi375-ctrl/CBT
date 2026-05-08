import { fetchExams, fetchQuestions } from './examService'
import { db } from '@/lib/offline/db'

// HYBRID STRATEGY:
// 1. Try Supabase first
// 2. Fallback to IndexedDB

export async function loadExam(examId, schoolId) {
  try {
    const { data: questions } = await fetchQuestions(examId)

    if (questions) {
      // cache locally
      await db.questions.bulkPut(questions)
      return questions
    }
  } catch (err) {
    console.log('Offline fallback activated')
  }

  // fallback offline
  return await db.questions.where('exam_id').equals(examId).toArray()
}
