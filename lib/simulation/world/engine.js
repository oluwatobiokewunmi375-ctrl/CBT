export function createSimulationWorld(student) {
  return {
    worldId: 'SIM-' + Date.now(),
    student,
    mode: 'PRACTICE',
    adaptive: true
  }
}
