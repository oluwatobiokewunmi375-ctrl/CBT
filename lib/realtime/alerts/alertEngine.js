export function generateAlert(event) {
  if (event.type === 'TAB_SWITCH') {
    return {
      level: 'WARNING',
      message: 'Student switched tab during exam',
      studentId: event.studentId
    }
  }

  return {
    level: 'INFO',
    message: 'Normal activity'
  }
}
