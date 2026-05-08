import axios from 'axios'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

// INITIALIZE PAYMENT
export async function initializePayment(email, amount) {
  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email,
      amount: amount * 100
    },
    {
      headers: {
        Authorization: Bearer 
      }
    }
  )

  return response.data
}

// VERIFY PAYMENT
export async function verifyPayment(reference) {
  const response = await axios.get(
    https://api.paystack.co/transaction/verify/,
    {
      headers: {
        Authorization: Bearer 
      }
    }
  )

  return response.data
}
