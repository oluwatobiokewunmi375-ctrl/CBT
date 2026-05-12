export function startAntiCheat(examId, userId) {

  const events = ["blur", "visibilitychange", "copy", "cut", "paste"]

  events.forEach(event => {
    window.addEventListener(event, async () => {

      const payload = {
        examId,
        userId,
        event,
        time: new Date().toISOString()
      }

      await fetch("/api/anti-cheat/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    })
  })
}