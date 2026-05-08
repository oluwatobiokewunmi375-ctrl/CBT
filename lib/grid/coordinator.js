export function createGlobalExam(exam) {
  return {
    id: exam.id,
    status: 'DISTRIBUTED',
    nodes: [],
    createdAt: Date.now()
  }
}
