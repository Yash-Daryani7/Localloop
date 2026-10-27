import mongoose from 'mongoose';

const serviceResponseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['offer', 'request'],
      required: [true, 'Service type (offer or request) is required']
    },
    category: {
      type: String,
      enum: [
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Cleaning',
        'Tutoring',
        'Delivery',
        'Gardening',
        'Other'
      ],
      default: 'Other'
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    },
    responses: [serviceResponseSchema],
    neighborhood: {
      type: String,
      required: [true, 'Neighborhood is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },
    budget: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest;
