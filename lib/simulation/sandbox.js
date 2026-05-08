export function runSandboxExam(config) {
  return {
    mode: 'SIMULATION',
    difficulty: config.level || 'MEDIUM',
    safeMode: true
  }
}
