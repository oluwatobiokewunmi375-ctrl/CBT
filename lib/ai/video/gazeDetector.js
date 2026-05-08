export function detectGaze(frames = []) {
  const offCenter = frames.filter(f => f.gaze === 'LEFT' || f.gaze === 'RIGHT').length

  if (offCenter > 5) {
    return {
      status: 'GAZE_DEVIATION',
      risk: 0.7
    }
  }

  return {
    status: 'NORMAL_GAZE',
    risk: 0.05
  }
}
