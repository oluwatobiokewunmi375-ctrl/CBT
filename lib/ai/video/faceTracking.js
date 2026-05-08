export function trackFace(frames = []) {
  const missingFrames = frames.filter(f => !f.faceDetected).length

  if (missingFrames > 3) {
    return {
      status: 'FACE_LOST',
      risk: 0.8
    }
  }

  return {
    status: 'FACE_STABLE',
    risk: 0.1
  }
}
