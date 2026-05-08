export const SchoolService = {
  getSchool: (id) => {
    return { id, status: 'ACTIVE' }
  },

  createSchool: (data) => {
    return { ...data, createdAt: Date.now() }
  }
}
