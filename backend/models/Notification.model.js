import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      enum: [
        'event_rsvp',
        'new_event',
        'new_message',
        'poll_vote',
        'new_poll',
        'listing_interest',
        'new_listing',
        'service_response',
        'new_service',
        'new_follower'
      ],
      required: [true, 'Notification type is required']
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
