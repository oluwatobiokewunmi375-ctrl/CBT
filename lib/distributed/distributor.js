export function distribute(tasks = []) {
  return tasks.map(task => ({
    task,
    node: 'distributed-node',
    status: 'PROCESSING'
  }))
}
