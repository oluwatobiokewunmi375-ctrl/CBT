import { getQueueJobs } from '../../queue/redis/queue'

export function processQueue() {
  const jobs = getQueueJobs()

  return jobs.map(job => {
    return {
      ...job,
      status: 'COMPLETED',
      processedAt: Date.now()
    }
  })
}
