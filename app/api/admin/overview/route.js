import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {

    const [schoolsRes, subsRes, paymentsRes] = await Promise.all([
      supabase.from('schools').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('payments').select('*')
    ])

    const schools = schoolsRes.data || []
    const subs = subsRes.data || []
    const payments = paymentsRes.data || []

    const activeSubs = subs.filter(s => s.status === 'active')

    const revenue = payments.reduce((sum, p) => {
      return sum + (p.amount || 0)
    }, 0)

    return Response.json({
      totalSchools: schools.length,
      activeSubscriptions: activeSubs.length,
      totalSubscriptions: subs.length,
      totalRevenue: revenue,
      recentPayments: payments.slice(-5)
    })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
