import { useEffect, useState } from 'react'

export function useLiveCBTFeed() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      setEvents(prev => [data, ...prev])
    }

    return () => ws.close()
  }, [])

  return events
}
