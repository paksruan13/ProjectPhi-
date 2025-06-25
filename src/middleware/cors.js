const cors = require('cors');

const corsConfig = cors({
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", 'stripe-signature'],
});

module.exports = corsConfig;