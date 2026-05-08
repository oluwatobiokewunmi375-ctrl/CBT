export default function DashboardPage() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh'
    }}>
      <aside style={{
        width: '250px',
        background: 'black',
        color: 'white',
        padding: '30px'
      }}>
        <h2>🎓 CBT SaaS</h2>

        <div style={{
          marginTop: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <a href="/admin" style={link}>Admin</a>
          <a href="/exam" style={link}>Exams</a>
          <a href="/pricing" style={link}>Pricing</a>
        </div>
      </aside>

      <main style={{
        flex: 1,
        padding: '40px',
        background: '#f5f7fb'
      }}>
        <h1>📊 Dashboard</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={card}>
            <h3>Total Students</h3>
            <h1>1,250</h1>
          </div>

          <div style={card}>
            <h3>Exams Conducted</h3>
            <h1>320</h1>
          </div>

          <div style={card}>
            <h3>Revenue</h3>
            <h1>₦2.5M</h1>
          </div>
        </div>
      </main>
    </div>
  )
}

const link = {
  color: 'white',
  textDecoration: 'none'
}

const card = {
  background: 'white',
  padding: '25px',
  borderRadius: '12px'
}
