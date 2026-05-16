const base = process.env.BASE_URL || 'http://localhost:3000'

async function post(path, body) {
  try {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return { status: res.status, ok: res.ok, data }
  } catch (err) {
    return { status: 0, ok: false, data: { error: String(err) } }
  }
}

async function run() {
  console.log('🔎 Verifying seeded accounts against', base)

  const tests = [
    {
      name: 'Super Admin (email)',
      body: { email: 'Adebayosamuel015@gmail.com', password: 'Hibilero@2104' }
    },
    {
      name: 'School Admin (email)',
      body: { email: 'samuela@laternabooks.ng', password: 'Laterna@1234' }
    },
    {
      name: 'Student (studentNo)',
      body: { studentNo: 'STU-lvl-0001' }
    }
  ]

  for (const t of tests) {
    process.stdout.write(`- ${t.name}: `)
    const res = await post('/api/auth/login', t.body)
    if (res.ok && res.data && res.data.success) {
      console.log('OK — token received')
      console.log('  user:', res.data.user?.email || res.data.user?.fullName || '(no user)')
    } else {
      console.log(`FAILED (status=${res.status})`)
      console.log('  response:', JSON.stringify(res.data))
    }
  }
}

run().catch(e => {
  console.error('Verification script error:', e)
  process.exit(1)
})
