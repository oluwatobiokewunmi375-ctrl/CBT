'use client'

import { useState } from 'react'

export default function NewLead() {
  const [schoolName, setSchoolName] = useState('')
  const [contact, setContact] = useState('')

  const submit = async () => {
    await fetch('/api/admin/crm', {
      method: 'POST',
      body: JSON.stringify({ schoolName, contact }),
      headers: { 'Content-Type': 'application/json' }
    })

    alert('Lead added')
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>➕ Add School Lead</h1>

      <input placeholder="School Name" onChange={e => setSchoolName(e.target.value)} />
      <input placeholder="Contact" onChange={e => setContact(e.target.value)} />

      <button onClick={submit}>Save Lead</button>
    </div>
  )
}
