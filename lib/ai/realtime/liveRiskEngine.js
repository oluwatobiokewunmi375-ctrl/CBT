let liveRisk = 0

export function updateLiveRisk(event) {
  if (event.type === 'TAB_SWITCH') liveRisk += 0.2
  if (event.type === 'FACE_LOST') liveRisk += 0.4
  if (event.type === 'MULTIPLE_FACES') liveRisk += 0.6

  if (liveRisk > 1.5) liveRisk = 1.5

  return liveRisk
}
