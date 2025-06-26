require('dotenv').config();
const express = require('express');
const http = require('http');

// Import configurations
const { configureSocket } = require('./config/socket');
const corsConfig = require('./middleware/cors');

// Import routes
const routes = require('./routes');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const port = process.env.PORT || 4243;
const server = http.createServer(app);

// Configure Socket.IO
const io = configureSocket(server);
app.set('io', io); // Make io available to routes

// Middleware
app.use(corsConfig);

// Special webhook route (needs raw body)
app.use('/webhook', webhookRoutes);

// JSON middleware for other routes
app.use(express.json());

// Routes
app.use('/api', routes);

server.listen(port, '0.0.0.0', () => {
  console.log(`Express & Socket.io server running on port ${port}`);
});