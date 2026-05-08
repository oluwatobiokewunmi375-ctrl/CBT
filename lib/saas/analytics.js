export function aggregateAnalytics(data = []) {
  return {
    totalSchools: data.length,
    totalStudents: data.reduce((a, b) => a + (b.students || 0), 0),
    totalExams: data.reduce((a, b) => a + (b.exams || 0), 0)
  }
}
