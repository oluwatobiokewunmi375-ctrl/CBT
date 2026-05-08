export default function HomePage() {
  return (
    <main style={{
      fontFamily: 'Arial',
      padding: '40px',
      background: '#f5f7fb',
      minHeight: '100vh'
    }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '50px'
      }}>
        <h2>🎓 CBT SaaS</h2>

        <div style={{ display: 'flex', gap: '15px' }}>
          <a href="/login">Login</a>
          <a href="/signup">Signup</a>
          <a href="/pricing">Pricing</a>
        </div>
      </nav>

      <section style={{
        textAlign: 'center',
        padding: '80px 20px'
      }}>
        <h1 style={{
          fontSize: '52px',
          marginBottom: '20px'
        }}>
          Digital CBT Platform For Schools
        </h1>

        <p style={{
          fontSize: '20px',
          color: '#555',
          maxWidth: '700px',
          margin: '0 auto 30px'
        }}>
          Run secure computer-based exams with automatic marking,
          anti-cheating protection, analytics, and school management.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <a href="/signup">
            <button style={{
              padding: '15px 30px',
              background: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Get Started
            </button>
          </a>

          <a href="/admin">
            <button style={{
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Admin Portal
            </button>
          </a>
        </div>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
        gap: '20px',
        marginTop: '80px'
      }}>
        <div style={cardStyle}>
          <h3>📝 CBT Exams</h3>
          <p>Create and manage digital examinations easily.</p>
        </div>

        <div style={cardStyle}>
          <h3>⚡ Auto Marking</h3>
          <p>Instant results and performance analytics.</p>
        </div>

        <div style={cardStyle}>
          <h3>🔐 Anti-Cheat</h3>
          <p>Behavior tracking and exam integrity systems.</p>
        </div>

        <div style={cardStyle}>
          <h3>🏫 Multi-School SaaS</h3>
          <p>Manage multiple schools securely.</p>
        </div>
      </section>
    </main>
  )
}

const cardStyle = {
  background: 'white',
  padding: '30px',
  borderRadius: '12px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
}
