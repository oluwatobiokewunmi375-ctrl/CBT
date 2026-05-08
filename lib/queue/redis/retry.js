export function handleRetry(job) {
  if (job.attempts >= 3) {
    return {
      ...job,
      status: 'FAILED_PERMANENTLY'
    }
  }

  return {
    ...job,
    attempts: job.attempts + 1,
    status: 'RETRYING'
  }
}
