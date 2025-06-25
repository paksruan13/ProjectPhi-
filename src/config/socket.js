const { Server } = require('socket.io');

const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", 'stripe-signature'],
    },
  });

  io.on('connection', (socket) => {
    console.log(socket.id, 'connected');

    socket.join('leaderboard');
    socket.on('join-leaderboard', () => {
      socket.join('leaderboard');
    });

    socket.on('disconnect', () => {
      console.log(socket.id, 'disconnected');
    });
  });

  return io;
};

module.exports = { configureSocket };