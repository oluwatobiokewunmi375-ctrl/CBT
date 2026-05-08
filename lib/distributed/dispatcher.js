import { assignWorker } from './workers'

const queue = []

export function dispatchTask(task) {
  const assigned = assignWorker(task)

  queue.push({
    ...assigned,
    dispatchedAt: Date.now()
  })

  return assigned
}
