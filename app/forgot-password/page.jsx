export default function ForgotPasswordPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#020617',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#0f172a',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #1e293b'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          Reset Password
        </h1>

        <p style={{
          color: '#94a3b8',
          marginBottom: '25px'
        }}>
          Enter your email to receive reset instructions.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #334155',
            background: '#020617',
            color: 'white',
            marginBottom: '20px'
          }}
        />

        <button style={{
          width: '100%',
          padding: '14px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          Send Reset Link
        </button>
      </div>
    </main>
  )
}
