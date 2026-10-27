import Notification from '../models/Notification.model.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar neighborhood')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving notifications',
      error: error.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      { read: true },
      { new: true }
    ).populate('sender', 'name avatar neighborhood');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating notification',
      error: error.message
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        read: false
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking all notifications as read',
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting notification',
      error: error.message
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    return res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching unread count',
      error: error.message
    });
  }
};
