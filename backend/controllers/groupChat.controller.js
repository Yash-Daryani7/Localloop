import GroupMessage from '../models/GroupMessage.model.js';
import User from '../models/User.model.js';
import { getIO } from '../socket.js';

export const getGroupMessages = async (req, res) => {
  try {
    const neighborhood = (req.query.neighborhood || req.user?.neighborhood || '').trim().toLowerCase();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    if (!neighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required'
      });
    }

    const messages = await GroupMessage.find({ neighborhood })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar neighborhood');

    const hasMore = messages.length === limit;
    messages.reverse();

    return res.status(200).json({
      success: true,
      messages,
      hasMore,
      page,
      neighborhood
    });
  } catch (error) {
    console.error('getGroupMessages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving group messages',
      error: error.message
    });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const neighborhood = (req.body.neighborhood || req.user?.neighborhood || '').trim().toLowerCase();

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (!neighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required'
      });
    }

    const message = new GroupMessage({
      sender: req.user._id,
      neighborhood,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to('neighborhood:' + neighborhood).emit('receive_group_message', message);
    }

    return res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('sendGroupMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending group message',
      error: error.message
    });
  }
};

export const getOnlineMembers = async (req, res) => {
  try {
    const neighborhood = (req.query.neighborhood || req.user?.neighborhood || '').trim().toLowerCase();

    if (!neighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required'
      });
    }

    const io = getIO();
    if (!io) {
      return res.status(200).json({
        success: true,
        members: [],
        count: 0
      });
    }

    const sockets = await io.in('neighborhood:' + neighborhood).fetchSockets();

    const membersMap = new Map();
    for (const socket of sockets) {
      if (socket.user && socket.user._id) {
        const userId = socket.user._id.toString();
        if (!membersMap.has(userId)) {
          membersMap.set(userId, socket.user);
        }
      }
    }

    const members = Array.from(membersMap.values());

    return res.status(200).json({
      success: true,
      members,
      count: members.length
    });
  } catch (error) {
    console.error('getOnlineMembers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving online members',
      error: error.message
    });
  }
};
