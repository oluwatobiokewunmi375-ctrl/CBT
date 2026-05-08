const workers = [
  { id: 'worker-1', status: 'ACTIVE' },
  { id: 'worker-2', status: 'ACTIVE' }
]

export function getWorkers() {
  return workers
}

export function assignWorker(task) {
  const worker = workers[Math.floor(Math.random() * workers.length)]

  return {
    workerId: worker.id,
    task,
    status: 'ASSIGNED'
  }
}
