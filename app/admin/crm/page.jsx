'use client'

import { useEffect, useState } from 'react'

export default function CRMPage() {
  const [leads, setLeads] = useState([])

  useEffect(() => {
    fetch('/api/admin/crm')
      .then(res => res.json())
      .then(setLeads)
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>📊 Sales CRM</h1>

      <p>Track school leads and conversions</p>

      {leads.map(lead => (
        <div key={lead.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <h3>{lead.schoolName}</h3>
          <p>Contact: {lead.contact}</p>
          <p>Status: {lead.status}</p>
        </div>
      ))}
    </div>
  )
}
