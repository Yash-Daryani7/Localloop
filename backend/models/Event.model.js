import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Community', 'Sports', 'Music', 'Food', 'Education', 'Other'],
      default: 'Community'
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    time: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    },
    images: [
      {
        type: String
      }
    ],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required']
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    maxAttendees: {
      type: Number,
      default: 100
    },
    neighborhood: {
      type: String,
      required: [true, 'Neighborhood is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true
  }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
