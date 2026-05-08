import { addToQueue } from './queue'

export function queueExamSubmission(data) {
  return addToQueue({
    type: 'EXAM_SUBMISSION',
    payload: data
  })
}
