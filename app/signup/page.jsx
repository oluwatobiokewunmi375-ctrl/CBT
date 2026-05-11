'use client'

import { useState } from 'react'

export default function SignupPage() {

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [errors] = useState({})

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#0f172a',
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial'
    }}>

      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#1e293b',
        padding: '30px',
        borderRadius: '14px'
      }}>

        <h1 style={{
          fontSize: '32px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          Create Account
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({...form, fullName: e.target.value})}
            style={inputStyle}
          />

          {errors.fullName && (
            <p style={errorStyle}>{errors.fullName}</p>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            style={inputStyle}
          />

          {errors.email && (
            <p style={errorStyle}>{errors.email}</p>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
            style={inputStyle}
          />

          {errors.password && (
            <p style={errorStyle}>{errors.password}</p>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
            style={inputStyle}
          />

          {errors.confirmPassword && (
            <p style={errorStyle}>{errors.confirmPassword}</p>
          )}
        </div>

        <button style={{
          width: '100%',
          padding: '15px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          Create Account
        </button>

      </div>

    </main>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white'
}

const errorStyle = {
  color: '#f87171',
  marginTop: '6px',
  fontSize: '14px'
}
