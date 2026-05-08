export const PaymentService = {
  createSubscription: (data) => {
    return {
      ...data,
      status: 'PENDING'
    }
  },

  verifyPayment: (ref) => {
    return {
      reference: ref,
      status: 'VERIFIED'
    }
  }
}
