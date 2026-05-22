'use client'

import { useState, useEffect } from "react"

export default function SuperAdmin() {
  const [schools, setSchools] = useState([])
  const [admins, setAdmins] = useState([])
  const [schoolName, setSchoolName] = useState("")
  const [schoolCode, setSchoolCode] = useState("")
  const [selectedSchoolId, setSelectedSchoolId] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminFullName, setAdminFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("schools")

  const [query, setQuery] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 6
  const [adminQuery, setAdminQuery] = useState("")
  const [adminPageIndex, setAdminPageIndex] = useState(0)
  const adminPageSize = 8

  // Ensure only SUPER_ADMIN users can access this client page
  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch('/api/auth/profile')
        if (!res.ok) {
          // Not authenticated, middleware should redirect but safeguard here
          window.location.href = '/login'
          return
        }
        const data = await res.json()
        const role = data?.profile?.role || ''
        if ((role || '').toString().toUpperCase() !== 'SUPER_ADMIN') {
          // Not super admin - redirect away
          window.location.href = '/dashboard'
        }
      } catch (err) {
        console.error('Role check failed', err)
      }
    }

    checkRole()
  }, [])

  useEffect(() => {
    fetchSchools()
    fetchAdmins()
  }, [])

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/school")
      if (res.ok) {
        const data = await res.json()
        setSchools(data.schools || [])
        if (!selectedSchoolId && data.schools && data.schools.length > 0) {
          setSelectedSchoolId(data.schools[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error)
    }
  }

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins")
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    }
  }

  const filteredSchools = schools.filter((s) => {
    const q = (query || '').toString().toLowerCase()
    if (!q) return true
    return (s.name || '').toString().toLowerCase().includes(q) || (s.shortCode || '').toString().toLowerCase().includes(q)
  })

  const createSchool = async () => {
    if (!schoolName || !schoolCode) {
      alert("Please fill all fields")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: schoolName, shortCode: schoolCode }),
      })

      if (res.ok) {
        alert("School created successfully!")
        setSchoolName("")
        setSchoolCode("")
        fetchSchools()
      } else {
        const error = await res.json()
        alert("Error: " + error.error)
      }
    } catch (error) {
      alert("Error creating school")
    } finally {
      setLoading(false)
    }
  }

  const createAdmin = async () => {
    if (!adminEmail || !adminPassword || !adminFullName) {
      alert("Please fill all fields")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          fullName: adminFullName,
          schoolId: selectedSchoolId,
        }),
      })

      if (res.ok) {
        alert("Admin created successfully!")
        setAdminEmail("")
        setAdminPassword("")
        setAdminFullName("")
        fetchAdmins()
      } else {
        const error = await res.json()
        alert("Error: " + error.error)
      }
    } catch (error) {
      alert("Error creating admin")
    } finally {
      setLoading(false)
    }
  }

  const seedDatabase = async () => {
    if (!confirm("This will populate the database with test data. Continue?")) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "CBT_SEED_2024" }),
      })

      if (res.ok) {
        const data = await res.json()
        alert("Database seeded successfully!\n\n" + JSON.stringify(data.accounts, null, 2))
        fetchSchools()
        fetchAdmins()
      } else {
        const error = await res.json()
        alert("Error: " + error.error)
      }
    } catch (error) {
      alert("Error seeding database")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>🚀 Super Admin Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("schools")}
          style={{
            padding: "10px 20px",
            marginRight: 10,
            backgroundColor: activeTab === "schools" ? "#007bff" : "#f8f9fa",
            color: activeTab === "schools" ? "white" : "black",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Manage Schools
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          style={{
            padding: "10px 20px",
            marginRight: 10,
            backgroundColor: activeTab === "admins" ? "#007bff" : "#f8f9fa",
            color: activeTab === "admins" ? "white" : "black",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Manage Admins
        </button>
        <button
          onClick={() => setActiveTab("seed")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "seed" ? "#28a745" : "#f8f9fa",
            color: activeTab === "seed" ? "white" : "black",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Seed Database
        </button>
      </div>

      {activeTab === "schools" && (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>Create New School</h2>

          <div style={{ marginBottom: 20 }}>
            <input
              placeholder="School Name"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              style={{
                padding: 10,
                marginRight: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                width: 200
              }}
            />

            <input
              placeholder="School Code (e.g., ABC_SCHOOL)"
              value={schoolCode}
              onChange={e => setSchoolCode(e.target.value)}
              style={{
                padding: 10,
                marginRight: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                width: 200
              }}
            />

            <button
              onClick={createSchool}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating..." : "Create School"}
            </button>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Existing Schools</h3>
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="Search schools by name or code"
              value={query}
              onChange={e => { setQuery(e.target.value); setPageIndex(0) }}
              style={{ padding: 10, marginRight: 10, border: "1px solid #ddd", borderRadius: 4, width: 320 }}
            />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {filteredSchools.length === 0 && (
              <div style={{ padding: 10, color: '#888' }}>No schools found</div>
            )}

            {filteredSchools.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map((school) => (
              <div key={school.id} style={{
                padding: 15,
                border: "1px solid #ddd",
                borderRadius: 8,
                backgroundColor: "#f9f9f9"
              }}>
                <h4 style={{ margin: "0 0 5px 0" }}>{school.name}</h4>
                <p style={{ margin: "0 0 5px 0", color: "#666" }}>Code: {school.shortCode}</p>
                <p style={{ margin: 0, color: "#666" }}>
                  Students: {school._count?.students || 0} |
                  Teachers: {school._count?.teachers || 0} |
                  Exams: {school._count?.exams || 0}
                </p>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button onClick={() => window.alert(JSON.stringify(school, null, 2))} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}>View</button>
                  <button onClick={() => { setSelectedSchoolId(school.id); setActiveTab('admins') }} style={{ padding: '6px 10px', borderRadius: 4, border: 'none', background: '#007bff', color: '#fff' }}>Manage Admins</button>
                  <button onClick={async () => {
                    const confirmDisable = confirm('Disable this school (soft-delete)?')
                    if (!confirmDisable) return
                    try {
                      const res = await fetch(`/api/school/${school.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disable' }) })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Failed')
                      alert('School disabled')
                      fetchSchools()
                    } catch (err) { alert('Disable failed: ' + err.message) }
                  }} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #e74c3c', background: '#fff', color: '#e74c3c' }}>Disable</button>
                  <button onClick={async () => {
                    const confirmDelete = confirm('Permanently delete this school? This cannot be undone.')
                    if (!confirmDelete) return
                    try {
                      const res = await fetch(`/api/school/${school.id}`, { method: 'DELETE' })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Failed')
                      alert('School deleted')
                      fetchSchools()
                    } catch (err) { alert('Delete failed: ' + err.message) }
                  }} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #a93226', background: '#a93226', color: '#fff' }}>Delete</button>
                </div>
              </div>
            ))}

            {filteredSchools.length > pageSize && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button disabled={pageIndex === 0} onClick={() => setPageIndex(p => Math.max(0, p - 1))} style={{ padding: '6px 10px' }}>Prev</button>
                <span style={{ color: '#666' }}>Page {pageIndex + 1} of {Math.ceil(filteredSchools.length / pageSize)}</span>
                <button disabled={(pageIndex + 1) * pageSize >= filteredSchools.length} onClick={() => setPageIndex(p => p + 1)} style={{ padding: '6px 10px' }}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "admins" && (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>Create School Admin</h2>

          <div style={{ marginBottom: 20 }}>
            <input
              type="email"
              placeholder="Admin Email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              style={{
                padding: 10,
                marginRight: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                width: 200
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              style={{
                padding: 10,
                marginRight: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                width: 150
              }}
            />

            <input
              placeholder="Full Name"
              value={adminFullName}
              onChange={e => setAdminFullName(e.target.value)}
              style={{
                padding: 10,
                marginRight: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                width: 200
              }}
            />

            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              style={{
                padding: 10,
                marginRight: 10,
                border: "1px solid #ddd",
                borderRadius: 4,
                width: 200
              }}
            >
              <option value="">Select School</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.shortCode})
                </option>
              ))}
            </select>

            <button
              onClick={createAdmin}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating..." : "Create Admin"}
            </button>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Existing Admins</h3>
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="Search admins by name or email"
              value={adminQuery}
              onChange={e => { setAdminQuery(e.target.value); setAdminPageIndex(0) }}
              style={{ padding: 10, marginRight: 10, border: "1px solid #ddd", borderRadius: 4, width: 320 }}
            />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {admins.filter(a => {
              const q = (adminQuery || '').toString().toLowerCase()
              if (!q) return true
              return (a.fullName || '').toString().toLowerCase().includes(q) || (a.email || '').toString().toLowerCase().includes(q)
            }).slice(adminPageIndex * adminPageSize, (adminPageIndex + 1) * adminPageSize).map((admin) => (
              <div key={admin.id} style={{
                padding: 15,
                border: "1px solid #ddd",
                borderRadius: 8,
                backgroundColor: "#f9f9f9"
              }}>
                <h4 style={{ margin: "0 0 5px 0" }}>{admin.fullName}</h4>
                <p style={{ margin: 0, color: "#666" }}>{admin.email}</p>
              </div>
            ))}
            {admins.length > adminPageSize && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button disabled={adminPageIndex === 0} onClick={() => setAdminPageIndex(p => Math.max(0, p - 1))} style={{ padding: '6px 10px' }}>Prev</button>
                <span style={{ color: '#666' }}>Page {adminPageIndex + 1} of {Math.ceil(admins.length / adminPageSize)}</span>
                <button disabled={(adminPageIndex + 1) * adminPageSize >= admins.length} onClick={() => setAdminPageIndex(p => p + 1)} style={{ padding: '6px 10px' }}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "seed" && (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 15 }}>Database Seeding</h2>

          <div style={{
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 8,
            backgroundColor: "#f9f9f9",
            marginBottom: 20
          }}>
            <h3 style={{ margin: "0 0 10px 0" }}>This will create:</h3>
            <ul style={{ margin: "0 0 15px 0", paddingLeft: 20 }}>
              <li>1 Test School</li>
              <li>1 Super Admin</li>
              <li>1 School Admin</li>
              <li>1 Teacher</li>
              <li>10 Students</li>
              <li>2 Classrooms</li>
              <li>2 Subjects</li>
              <li>1 Sample Exam with 4 questions</li>
              <li>Sample results for 5 students</li>
            </ul>

            <button
              onClick={seedDatabase}
              disabled={loading}
              style={{
                padding: "12px 24px",
                backgroundColor: loading ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16
              }}
            >
              {loading ? "Seeding..." : "Seed Database with Test Data"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}