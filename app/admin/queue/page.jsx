'use client'

import { useEffect, useState } from 'react'

export default function QueueDashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/admin/queue')
      .then(r => r.json())
      .then(setData)
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>🧠 Queue System Monitor</h1>

      <p>Total Jobs: {data.length}</p>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
