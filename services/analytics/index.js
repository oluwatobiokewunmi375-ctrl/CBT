export const AnalyticsService = {
  track: (event) => {
    return {
      event,
      timestamp: Date.now()
    }
  },

  report: () => {
    return {
      students: 0,
      exams: 0,
      revenue: 0
    }
  }
}
