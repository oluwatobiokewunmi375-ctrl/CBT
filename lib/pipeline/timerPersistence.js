import { db } from '../offline/db';

export async function persistExamTimer(examId, timeLeft) {

  await db.syncQueue.add({
    type: 'TIMER',
    examId,
    timeLeft,
    updatedAt: Date.now()
  });

  const key = `cbt_timer_${examId}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      timeLeft,
      updatedAt: Date.now()
    })
  );

}
