export const WorkerService = {
  process: (job) => {
    return {
      jobId: job.id,
      status: 'PROCESSED'
    }
  }
}
