import crypto from 'crypto'
import { supabase } from '@/lib/supabase/client'

// VERIFY PAYSTACK SIGNATURE
function verifySignature(body, signature) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest('hex')

  return hash === signature
}

export async function POST(req) {
  try {
    const body = await req.json()
    const signature = req.headers.get('x-paystack-signature')

    if (!verifySignature(body, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = body.event

    // PAYMENT SUCCESS HANDLER
    if (event === 'charge.success') {
      const data = body.data

      const email = data.customer.email
      const amount = data.amount

      // ACTIVATE SUBSCRIPTION
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          paid_at: new Date()
        })
        .eq('email', email)

      return Response.json({ status: 'success' })
    }

    return Response.json({ status: 'ignored' })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
