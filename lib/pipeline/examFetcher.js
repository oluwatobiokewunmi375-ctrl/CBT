import { db } from '../offline/db';

export async function fetchExamWithOfflineSupport(examId) {

  try {

    const res = await fetch(`/api/exams/${examId}`);

    if (!res.ok) throw new Error('API failed');

    const exam = await res.json();

    await db.exams.put({
      id: exam.id,
      payload: exam
    });

    if (exam.questions?.length) {

      for (const q of exam.questions) {

        await db.questions.put({
          ...q,
          examId: exam.id
        });

      }

    }

    return exam;

  } catch (err) {

    console.log('⚠️ Offline mode activated');

    const localExam = await db.exams.get(examId);

    if (!localExam) return null;

    const questions = await db.questions
      .where('examId')
      .equals(examId)
      .toArray();

    return {
      ...localExam.payload,
      questions
    };

  }

}
