const jobs = []

export function addToQueue(job) {
  const task = {
    id: Math.random().toString(36).substring(2),
    ...job,
    status: 'PENDING',
    attempts: 0,
    createdAt: Date.now()
  }

  jobs.push(task)
  return task
}

export function getQueueJobs() {
  return jobs
}
