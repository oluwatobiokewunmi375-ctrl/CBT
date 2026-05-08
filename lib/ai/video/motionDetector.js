export function detectMotion(frames = []) {
  const spikes = frames.filter(f => f.movement > 7).length

  if (spikes > 6) {
    return {
      status: 'SUSPICIOUS_MOVEMENT',
      risk: 0.6
    }
  }

  return {
    status: 'NORMAL_MOVEMENT',
    risk: 0.1
  }
}
