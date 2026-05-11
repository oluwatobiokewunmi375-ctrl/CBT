'use client'

import { loadExam } from '@/lib/exams/examLoader'
import { useOfflineExam }
from '@/hooks/useOfflineExam';

export default function OfflineExamRunner({

  examId = 1

}) {

  const {

    exam,
    answers,
    timeLeft,
    loading,
    saveAnswer,
    saveTimer,
    trackNavigation

  } = useOfflineExam(examId);

  if (loading) {

    return (
      <div className='p-6'>
        Loading Offline Exam...
      </div>
    );

  }

  if (!exam) {

    return (
      <div className='p-6 text-red-500'>
        Exam unavailable offline
      </div>
    );

  }

  return (

    <div className='p-6 space-y-6'>

      <div className='text-xl font-bold'>
        {exam.title || 'CBT Exam'}
      </div>

      <div>
        Time Left: {timeLeft || 'Not Started'}
      </div>

      {exam.questions?.map((q, index) => (

        <div
          key={q.id}
          className='border p-4 rounded'
        >

          <div className='mb-2'>
            {index + 1}. {q.question}
          </div>

          <div className='space-y-2'>

            {q.options?.map((opt, i) => (

              <button
                key={i}
                className='block border px-3 py-2 rounded w-full text-left'
                onClick={async () => {

                  await saveAnswer(q.id, opt);

                  await trackNavigation(index);

                }}
              >

                {opt}

              </button>

            ))}

          </div>

        </div>

      ))}

      <button
        onClick={() =>
          saveTimer((timeLeft || 3600) - 60)
        }
        className='bg-black text-white px-4 py-2 rounded'
      >

        Simulate Timer Tick

      </button>

    </div>

  );

}

