import jwt from 'jsonwebtoken';
import User from './models/User.model.js';
import Message from './models/Message.model.js';
import GroupMessage from './models/GroupMessage.model.js';
import Notification from './models/Notification.model.js';

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
        const neighborhoodRoom = `neighborhood:${socket.user.neighborhood}`;
        socket.join(neighborhoodRoom);
        console.log(`User joined neighborhood room: ${neighborhoodRoom}`);
      }
    }

    // Join arbitrary neighborhood room
    socket.on('join_neighborhood', (neighborhood) => {
      if (neighborhood) {
        const room = `neighborhood:${neighborhood}`;
        socket.join(room);
        console.log(`Socket ${socket.id} manually joined ${room}`);
      }
    });

    // Handle real-time messaging
    socket.on('send_message', async (data, callback) => {
      try {
        const senderId = socket.user?._id || data.senderId;
        const { receiverId, content } = data;

        if (!senderId || !receiverId || !content) {
          if (callback) callback({ error: 'Missing required message parameters' });
          return;
        }

        const conversationId = [senderId.toString(), receiverId.toString()].sort().join('_');

        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          content,
          conversationId
        });
        await message.save();
        await message.populate('sender', 'name avatar neighborhood');

        // Emit to receiver's private room
        io.to(`user:${receiverId}`).emit('receive_message', message);

        // Also emit notification to receiver
        const notification = new Notification({
          recipient: receiverId,
          sender: senderId,
          type: 'new_message',
          referenceId: message._id,
          message: `New message from ${socket.user?.name || 'a user'}: "${content.substring(0, 30)}..."`
        });
        await notification.save();
        await notification.populate('sender', 'name avatar neighborhood');

        io.to(`user:${receiverId}`).emit('new_notification', notification);

        if (callback) callback({ status: 'ok', message });
      } catch (error) {
        console.error('Socket send_message error:', error);
        if (callback) callback({ error: error.message });
      }
    });

    // Handle real-time new event broadcast
    socket.on('new_event', (eventData) => {
      if (eventData?.neighborhood) {
        io.to(`neighborhood:${eventData.neighborhood}`).emit('event_created', eventData);
      }
    });

    // Handle real-time new listing broadcast
    socket.on('new_listing', (listingData) => {
      if (listingData?.neighborhood) {
        io.to(`neighborhood:${listingData.neighborhood}`).emit('listing_created', listingData);
      }
    });

    // Handle real-time new poll broadcast
    socket.on('new_poll', (pollData) => {
      if (pollData?.neighborhood) {
        io.to(`neighborhood:${pollData.neighborhood}`).emit('poll_created', pollData);
      }
    });

    // Handle real-time poll vote broadcast
    socket.on('poll_vote', (pollData) => {
      if (pollData?.neighborhood) {
        io.to(`neighborhood:${pollData.neighborhood}`).emit('poll_updated', pollData);
      }
    });

    // Handle group chat message
    socket.on('send_group_message', async (data, callback) => {
      try {
        const senderId = socket.user?._id;
        if (!senderId) {
          if (callback) callback({ error: 'Authentication required' });
          return;
        }

        const { content, neighborhood } = data;
        const targetNeighborhood = neighborhood || socket.user.neighborhood;

        if (!content || !content.trim()) {
          if (callback) callback({ error: 'Message content is required' });
          return;
        }

        const message = new GroupMessage({
          sender: senderId,
          neighborhood: targetNeighborhood,
          content: content.trim()
        });
        await message.save();
        await message.populate('sender', 'name avatar neighborhood');

        // Broadcast to entire neighborhood room
        io.to(`neighborhood:${targetNeighborhood}`).emit('receive_group_message', message);

        if (callback) callback({ status: 'ok', message });
      } catch (error) {
        console.error('Socket send_group_message error:', error);
        if (callback) callback({ error: error.message });
      }
    });

    // Handle group typing indicator
    socket.on('typing_group', (data) => {
      if (socket.user) {
        const neighborhood = data?.neighborhood || socket.user.neighborhood;
        socket.to(`neighborhood:${neighborhood}`).emit('user_typing_group', {
          userId: socket.user._id,
          name: socket.user.name
        });
      }
    });

    // Handle stop typing in group
    socket.on('stop_typing_group', (data) => {
      if (socket.user) {
        const neighborhood = data?.neighborhood || socket.user.neighborhood;
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
