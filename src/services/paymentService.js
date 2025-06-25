const stripeClient = require('../config/stripe');
const { prisma } = require('../config/database');

const createCheckoutSession = async (sessionData) => {
  return await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Donation' },
        unit_amount: Math.round(sessionData.amount * 100),
      },
      quantity: 1,
    }],
    metadata: { 
      teamId: sessionData.teamId, 
      userId: sessionData.userId 
    },
    success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/cancel"
  });
};

const handleCompletedPayment = async (session) => {
  const { teamId, userId } = session.metadata || {};
  const amount = session.amount_total / 100;
  
  if (!teamId) {
    throw new Error('No teamId in session metadata');
  }

  return await prisma.donation.create({
    data: {
      amount,
      currency: session.currency,
      stripeSessionId: session.id,
      user: userId ? { connect: { id: userId } } : undefined,
      team: { connect: { id: teamId } },
    },
  });
};

module.exports = {
  createCheckoutSession,
  handleCompletedPayment
};