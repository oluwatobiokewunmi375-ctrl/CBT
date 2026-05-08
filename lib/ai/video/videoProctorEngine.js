import { computeVideoRisk } from './videoRiskEngine'

export function videoProctorDecision(videoData, behaviorRisk = 0) {
  const video = computeVideoRisk(videoData)

  const total = video.totalRisk + behaviorRisk

  return {
    score: total,
    decision:
      total > 1.5
        ? 'TERMINATE_SESSION'
        : total > 0.8
        ? 'FLAG_STUDENT'
        : 'ALLOW_CONTINUE'
  }
}
