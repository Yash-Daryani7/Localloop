import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { getIO } from '../socket.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name avatar neighborhood')
      .populate('following', 'name avatar neighborhood');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userObj = user.toObject();
    userObj.followersCount = user.followers.length;
    userObj.followingCount = user.following.length;

    return res.status(200).json({
      success: true,
      user: userObj
    });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, neighborhood, lat, lng } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (neighborhood) user.neighborhood = neighborhood;
    if (lat !== undefined) user.lat = lat ? Number(lat) : null;
    if (lng !== undefined) user.lng = lng ? Number(lng) : null;

    // Upload avatar to Cloudinary if a file was submitted
    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer, 'localloop/avatars');
      user.avatar = avatarUrl;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userObj
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    // Create notification
    const notification = new Notification({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'new_follower',
      referenceId: currentUserId,
      message: `${currentUser.name} started following you.`
    });
    await notification.save();
    await notification.populate('sender', 'name avatar neighborhood');

    // Emit socket notification
    const io = getIO();
    if (io) {
      io.to(`user:${targetUserId}`).emit('new_notification', notification);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully followed ${targetUser.name}`
    });
  } catch (error) {
    console.error('followUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error following user',
      error: error.message
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId }
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('unfollowUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error unfollowing user',
      error: error.message
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q, neighborhood } = req.query;
    const query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { neighborhood: { $regex: q, $options: 'i' } }
      ];
    }

    if (neighborhood) {
      query.neighborhood = { $regex: neighborhood, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .limit(30);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('searchUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error searching users',
      error: error.message
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'followers',
      'name avatar neighborhood bio'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      followers: user.followers
    });
  } catch (error) {
    console.error('getFollowers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching followers',
      error: error.message
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'following',
      'name avatar neighborhood bio'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      following: user.following
    });
  } catch (error) {
    console.error('getFollowing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching following',
      error: error.message
    });
  }
};
