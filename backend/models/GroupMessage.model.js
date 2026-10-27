import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    neighborhood: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

groupMessageSchema.index({ neighborhood: 1, createdAt: -1 });

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
export default GroupMessage;
