import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    },
    conversationId: {
      type: String,
      required: false // Generated automatically in pre-save if not explicitly passed
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: set conversationId as sorted join of sender and receiver IDs
messageSchema.pre('save', function (next) {
  if (this.sender && this.receiver) {
    const ids = [this.sender.toString(), this.receiver.toString()].sort();
    this.conversationId = ids.join('_');
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
