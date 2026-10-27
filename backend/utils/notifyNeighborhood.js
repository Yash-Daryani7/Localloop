import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { getIO } from '../socket.js';

export const notifyNeighborhood = async ({
  neighborhood,
  sender,
  additionalRecipients = [],
  type,
  referenceId,
  message
}) => {
  const senderId = sender._id || sender;
  const normalizedNeighborhood = neighborhood.trim().toLowerCase();
  const neighborhoodUsers = await User.find({
    neighborhood: normalizedNeighborhood,
    _id: { $ne: senderId }
  }).select('_id');

  const recipientIds = new Set([
    ...neighborhoodUsers.map((user) => user._id.toString()),
    ...additionalRecipients
      .filter((recipientId) => recipientId.toString() !== senderId.toString())
      .map((recipientId) => recipientId.toString())
  ]);

  if (recipientIds.size === 0) {
    return;
  }

  const notifications = await Notification.insertMany(
    Array.from(recipientIds, (recipientId) => ({
      recipient: recipientId,
      sender: senderId,
      type,
      referenceId,
      message
    }))
  );
  await Notification.populate(notifications, {
    path: 'sender',
    select: 'name avatar neighborhood'
  });

  const io = getIO();
  if (io) {
    notifications.forEach((notification) => {
      io.to(`user:${notification.recipient}`).emit('new_notification', notification);
    });
  }
};
