export function orchestrateExam(schools, exam) {
  return schools.map(s => ({
    schoolId: s.id,
    examId: exam.id,
    status: 'SCHEDULED'
  }))
}
