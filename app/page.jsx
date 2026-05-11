'use client'

import Link from 'next/link'

export default function HomePage() {

  const features = [
    {
      title: 'CBT Exams',
      desc: 'Run secure online examinations for schools.'
    },
    {
      title: 'Analytics',
      desc: 'Track student performance and results.'
    },
    {
      title: 'Payments',
      desc: 'Accept subscriptions with Paystack.'
    }
  ]

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      padding: '40px',
      fontFamily: 'Arial'
    }}>

      <section style={{ textAlign: 'center', marginTop: '60px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          🎓 CBT SaaS Platform
        </h1>

        <p style={{
          fontSize: '20px',
          color: '#cbd5e1',
          marginBottom: '40px'
        }}>
          Professional Computer Based Testing System
        </p>

        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link href="/login">
            <button style={{
              padding: '15px 30px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}>
              Login
            </button>
          </Link>

          <Link href="/signup">
            <button style={{
              padding: '15px 30px',
              background: 'black',
              color: 'white',
              border: '1px solid white',
              borderRadius: '10px',
              cursor: 'pointer'
            }}>
              Signup
            </button>
          </Link>

          <Link href="/pricing">
            <button style={{
              padding: '15px 30px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}>
              Pricing
            </button>
          </Link>
        </div>
      </section>

      <section style={{
        marginTop: '80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
        gap: '20px'
      }}>
        {features.map((feature, index) => (
          <div
            key={index}
            style={{
              background: '#1e293b',
              padding: '25px',
              borderRadius: '12px'
            }}
          >
            <h2 style={{
              fontSize: '24px',
              marginBottom: '10px'
            }}>
              {feature.title}
            </h2>

            <p style={{ color: '#cbd5e1' }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

    </main>
  )
}
