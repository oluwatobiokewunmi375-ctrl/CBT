'use client'

import { useState } from "react"

export default function SuperAdmin() {
  const [name, setName] = useState("")

  const createSchool = async () => {
    await fetch("/api/school/create", {
      method: "POST",
      body: JSON.stringify({ name })
    })

    alert("School Created")
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>SUPER ADMIN</h1>

      <input
        placeholder="School Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <button onClick={createSchool}>
        Create School
      </button>
    </div>
  )
}