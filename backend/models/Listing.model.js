import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Listing description is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['sell', 'buy', 'free'],
      required: [true, 'Listing type is required']
    },
    price: {
      type: Number,
      default: 0
    },
    images: [
      {
        type: String
      }
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required']
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'closed'],
      default: 'active'
    },
    category: {
      type: String,
      enum: [
        'Electronics',
        'Furniture',
        'Clothing',
        'Books',
        'Vehicles',
        'Food',
        'Services',
        'Other'
      ],
      default: 'Other'
    },
    neighborhood: {
      type: String,
      required: [true, 'Neighborhood is required'],
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
    contactInfo: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
