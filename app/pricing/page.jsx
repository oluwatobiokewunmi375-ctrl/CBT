export default function PricingPage() {
  return (
    <div style={{
      padding: '50px',
      background: '#f5f7fb',
      minHeight: '100vh'
    }}>
      <h1>💳 Pricing</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
        gap: '20px',
        marginTop: '40px'
      }}>
        <div style={card}>
          <h2>Starter</h2>
          <h1>₦25,000</h1>
          <p>Basic CBT setup for small schools.</p>
        </div>

        <div style={card}>
          <h2>Professional</h2>
          <h1>₦75,000</h1>
          <p>Advanced exams, analytics, anti-cheat.</p>
        </div>

        <div style={card}>
          <h2>Enterprise</h2>
          <h1>Custom</h1>
          <p>Large-scale school deployments.</p>
        </div>
      </div>
    </div>
  )
}

const card = {
  background: 'white',
  padding: '30px',
  borderRadius: '12px'
}

