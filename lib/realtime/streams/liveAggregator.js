let liveStats = {
  totalEvents: 0,
  activeStudents: new Set(),
  riskEvents: 0
};

export function updateLiveStats(event) {
  liveStats.totalEvents++;

  if (event.studentId) {
    liveStats.activeStudents.add(event.studentId);
  }

  if (event.type === 'TAB_SWITCH') {
    liveStats.riskEvents++;
  }

  return {
    totalEvents: liveStats.totalEvents,
    activeStudents: liveStats.activeStudents.size,
    riskEvents: liveStats.riskEvents
  };
}
