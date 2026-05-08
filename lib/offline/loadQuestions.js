import { db } from '@/lib/offline/db';

export async function loadOfflineQuestions(examId) {

  return await db.questions
    .where({ examId })
    .toArray();

}
