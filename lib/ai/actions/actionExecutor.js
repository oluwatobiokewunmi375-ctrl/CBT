export function executeAction(action, context) {
  switch(action) {

    case 'FREEZE_EXAM':
      return {
        status: 'frozen',
        message: 'Exam temporarily paused due to suspicious activity'
      }

    case 'WARN_STUDENT':
      return {
        status: 'warning',
        message: 'Please focus on your exam'
      }

    case 'LOCK_SESSION':
      return {
        status: 'locked',
        message: 'Session locked due to policy violation'
      }

    default:
      return {
        status: 'ok'
      }
  }
}
