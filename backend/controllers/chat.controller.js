import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { getIO } from '../socket.js';

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Retrieve all messages involving the current user, newest first
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .lean();

    const conversationsMap = new Map();

    for (const msg of messages) {
      if (!conversationsMap.has(msg.conversationId)) {
        const otherUserId =
          msg.sender.toString() === currentUserId.toString()
            ? msg.receiver.toString()
            : msg.sender.toString();

        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          lastMessage: msg,
          otherUserId,
          unreadCount: 0
        });
      }

      // Count unread messages received by the current user
      if (
        msg.receiver.toString() === currentUserId.toString() &&
        msg.read === false
      ) {
        const conv = conversationsMap.get(msg.conversationId);
        conv.unreadCount += 1;
      }
    }

    const conversationList = Array.from(conversationsMap.values());
    const otherUserIds = conversationList.map((c) => c.otherUserId);

    const users = await User.find({ _id: { $in: otherUserIds } })
      .select('name avatar neighborhood bio')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const enrichedConversations = conversationList.map((conv) => ({
      conversationId: conv.conversationId,
      otherUser: userMap.get(conv.otherUserId) || {
        _id: conv.otherUserId,
        name: 'LocalLoop User',
        avatar: '',
        neighborhood: ''
      },
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount
    }));

    return res.status(200).json({
      success: true,
      conversations: enrichedConversations
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving conversations',
      error: error.message
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Verify current user belongs to this conversation
    const parts = conversationId.split('_');
    if (!parts.includes(currentUserId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this conversation'
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar neighborhood')
      .populate('receiver', 'name avatar neighborhood')
      .sort({ createdAt: 1 });

    // Mark unread messages sent to current user as read
    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('getMessages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving messages',
      error: error.message
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'receiverId and content are required'
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    const conversationId = [senderId.toString(), receiverId.toString()].sort().join('_');

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      conversationId,
      read: false
    });

    await message.save();
    await message.populate('sender', 'name avatar neighborhood');
    await message.populate('receiver', 'name avatar neighborhood');

    // Create notification for receiver
    const notification = new Notification({
      recipient: receiverId,
      sender: senderId,
      type: 'new_message',
      referenceId: message._id,
      message: `New message from ${req.user.name}: "${content.substring(0, 30)}..."`
    });
    await notification.save();
    await notification.populate('sender', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      // Emit to receiver's private room
      io.to(`user:${receiverId}`).emit('receive_message', message);
      io.to(`user:${receiverId}`).emit('new_notification', notification);
    }

    return res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending message',
      error: error.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking messages as read',
      error: error.message
    });
  }
};
