'use client'

import { useEffect, useState } from 'react'

export default function ObservabilityDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/admin/observability')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>📡 System Observability Center</h1>

      {!data && <p>Loading system insights...</p>}

      {data && (
        <>
          <h3>🚨 Errors: {data.errors}</h3>
          <h3>📡 Events: {data.events}</h3>
          <h3>⚡ Avg Latency: {data.latency}ms</h3>
          <h3>📊 Requests: {data.requests}</h3>
        </>
      )}
    </div>
  )
}
