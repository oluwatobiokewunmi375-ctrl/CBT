export const ExamService = {
  createExam: (exam) => {
    return {
      ...exam,
      status: 'DRAFT'
    }
  },

  submitExam: (data) => {
    return {
      ...data,
      status: 'SUBMITTED'
    }
  }
}
