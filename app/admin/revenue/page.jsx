'use client'

import { useEffect, useState } from 'react'

export default function RevenueDashboard() {

  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>LIVE SaaS Revenue Dashboard</h1>

      {!data && <p>Loading live data...</p>}

      {data && (
        <div>
          <h3>🏫 Schools: {data.totalSchools}</h3>
          <h3>💳 Active Subscriptions: {data.activeSubscriptions}</h3>
          <h3>📦 Total Subscriptions: {data.totalSubscriptions}</h3>
          <h3>💰 Revenue: ₦{data.totalRevenue}</h3>

          <h4>Recent Payments</h4>
          <pre>{JSON.stringify(data.recentPayments, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
