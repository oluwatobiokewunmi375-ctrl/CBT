import { trackFace } from './faceTracking'
import { detectGaze } from './gazeDetector'
import { detectMotion } from './motionDetector'

export function computeVideoRisk(data) {
  const face = trackFace(data.frames || [])
  const gaze = detectGaze(data.frames || [])
  const motion = detectMotion(data.frames || [])

  const totalRisk =
    face.risk +
    gaze.risk +
    motion.risk

  return {
    totalRisk,
    status:
      totalRisk > 1.2
        ? 'HIGH_RISK'
        : totalRisk > 0.5
        ? 'MEDIUM_RISK'
        : 'LOW_RISK'
  }
}
