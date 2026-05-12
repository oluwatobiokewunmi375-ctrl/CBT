'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export default function LiveMonitor() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const channel = supabase
      .channel("live-monitor")
      .on("broadcast", { event: "exam-event" }, (payload) => {
        setEvents(prev => [...prev, payload])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>LIVE EXAM MONITOR</h1>

      {events.map((e, i) => (
        <div key={i}>
          {e.payload.event} - {e.payload.examId}
        </div>
      ))}
    </div>
  )
}