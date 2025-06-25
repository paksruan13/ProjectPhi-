const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook handler (needs raw body)
router.post('/', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Checkout session creation
router.post('/create-checkout-session', express.json(), webhookController.createCheckoutSession);

module.exports = router;