export function orchestrateGlobalExam(nodes, exam) {
  return {
    exam,
    distributed: true,
    nodeCount: nodes.length,
    status: 'RUNNING'
  }
}
