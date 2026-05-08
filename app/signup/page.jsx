'use client'

export default function SignupPage() {
  return (
    <div style={container}>
      <form style={form}>
        <h1>🏫 School Signup</h1>

        <input placeholder="School Name" style={input} />
        <input placeholder="Admin Email" style={input} />
        <input placeholder="Password" type="password" style={input} />

        <button style={button}>
          Create School Account
        </button>

        <p>
          Already registered? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  )
}

const container = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: '#f5f7fb'
}

const form = {
  background: 'white',
  padding: '40px',
  borderRadius: '12px',
  width: '400px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
}

const input = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd'
}

const button = {
  padding: '14px',
  background: 'black',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
}
