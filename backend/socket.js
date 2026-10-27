import jwt from 'jsonwebtoken';
import User from './models/User.model.js';

const normalizeNeighborhood = (value) => String(value || '').trim().toLowerCase();

export let io = null;

export const getIO = () => {
  return io;
};

export const initSocket = (serverIO) => {
  io = serverIO;

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Check cookie if token not in handshake.auth
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {});
        token = cookies.token;
      }

      // Check authorization header fallback
      if (!token && socket.handshake.headers?.authorization?.startsWith('Bearer ')) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'localloop_jwt_default_secret_key'
        );
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          socket.user = user;
        }
      }

      next();
    } catch (err) {
      console.warn('Socket authentication warning:', err.message);
      // Proceed even if unauthenticated, protected events can check socket.user
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.name || 'Guest'})`);

    // Automatically join user-specific room if authenticated
    if (socket.user?._id) {
      const userRoom = `user:${socket.user._id}`;
      socket.join(userRoom);
      console.log(`User ${socket.user._id} joined room ${userRoom}`);

      // Automatically join user's neighborhood room
      if (socket.user.neighborhood) {
        const neighborhoodRoom = `neighborhood:${normalizeNeighborhood(socket.user.neighborhood)}`;
        socket.join(neighborhoodRoom);
        console.log(`User joined neighborhood room: ${neighborhoodRoom}`);
      }
    }

    // Only allow authenticated users to join their own neighborhood room.
    socket.on('join_neighborhood', (neighborhood) => {
      const ownNeighborhood = normalizeNeighborhood(socket.user?.neighborhood);
      if (ownNeighborhood && normalizeNeighborhood(neighborhood) === ownNeighborhood) {
        const room = `neighborhood:${ownNeighborhood}`;
        socket.join(room);
        console.log(`Socket ${socket.id} manually joined ${room}`);
      }
    });

    // Handle group typing indicator
    socket.on('typing_group', () => {
      if (socket.user?.neighborhood) {
        const neighborhood = normalizeNeighborhood(socket.user.neighborhood);
        socket.to(`neighborhood:${neighborhood}`).emit('user_typing_group', {
          userId: socket.user._id,
          name: socket.user.name
        });
      }
    });

    // Handle stop typing in group
    socket.on('stop_typing_group', () => {
      if (socket.user?.neighborhood) {
        const neighborhood = normalizeNeighborhood(socket.user.neighborhood);
        socket.to(`neighborhood:${neighborhood}`).emit('user_stop_typing_group', {
          userId: socket.user._id,
          name: socket.user.name
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
};

export default initSocket;
