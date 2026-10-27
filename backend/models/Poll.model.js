import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true
    },
    votes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true
    },
    options: {
      type: [pollOptionSchema],
      validate: {
        validator: function (opts) {
          return Array.isArray(opts) && opts.length >= 2;
        },
        message: 'Poll must have at least 2 options'
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
    neighborhood: {
      type: String,
      required: [true, 'Neighborhood is required'],
      trim: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    }
  },
  {
    timestamps: true
  }
);

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
