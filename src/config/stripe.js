const Stripe = require('stripe');

const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

module.exports = stripeClient;