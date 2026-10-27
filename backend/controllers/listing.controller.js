import Listing from '../models/Listing.model.js';
import Notification from '../models/Notification.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { notifyNeighborhood } from '../utils/notifyNeighborhood.js';
import { getIO } from '../socket.js';

export const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      price,
      category,
      neighborhood,
      lat,
      lng,
      contactInfo
    } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and type (sell, buy, free) are required.'
      });
    }

    const listingNeighborhood = neighborhood || req.user.neighborhood;
    if (!listingNeighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required.'
      });
    }

    // Upload images if uploaded
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'localloop/listings')
      );
      imageUrls = await Promise.all(uploadPromises);
    } else if (req.body.images) {
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const listing = new Listing({
      title,
      description,
      type,
      price: price ? Number(price) : 0,
      category: category || 'Other',
      images: imageUrls,
      seller: req.user._id,
      neighborhood: listingNeighborhood,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      contactInfo: contactInfo || '',
      status: 'active'
    });

    await listing.save();
    await listing.populate('seller', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to(`neighborhood:${listing.neighborhood}`).emit('listing_created', listing);
    }

    await notifyNeighborhood({
      neighborhood: listing.neighborhood,
      sender: req.user._id,
      type: 'new_listing',
      referenceId: listing._id,
      message: `${req.user.name} posted a new marketplace item: "${listing.title}".`
    });

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('createListing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating listing',
      error: error.message
    });
  }
};

export const getListings = async (req, res) => {
  try {
    const {
      type,
      category,
      neighborhood,
      status,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (neighborhood) query.neighborhood = neighborhood;
    if (status) query.status = status;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, totalListings] = await Promise.all([
      Listing.find(query)
        .populate('seller', 'name avatar neighborhood')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Listing.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      listings,
      totalListings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalListings / parseInt(limit))
    });
  } catch (error) {
    console.error('getListings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving listings',
      error: error.message
    });
  }
};

export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'seller',
      'name avatar email neighborhood bio'
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    return res.status(200).json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('getListingById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving listing',
      error: error.message
    });
  }
};

export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the seller can update this listing'
      });
    }

    const {
      title,
      description,
      type,
      price,
      category,
      neighborhood,
      lat,
      lng,
      contactInfo,
      status
    } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (type) listing.type = type;
    if (price !== undefined) listing.price = Number(price);
    if (category) listing.category = category;
    if (neighborhood) listing.neighborhood = neighborhood;
    if (lat !== undefined) listing.lat = lat ? Number(lat) : null;
    if (lng !== undefined) listing.lng = lng ? Number(lng) : null;
    if (contactInfo !== undefined) listing.contactInfo = contactInfo;
    if (status) listing.status = status;

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'localloop/listings')
      );
      const newUrls = await Promise.all(uploadPromises);
      listing.images = [...listing.images, ...newUrls];
    }

    await listing.save();
    await listing.populate('seller', 'name avatar neighborhood');

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      listing
    });
  } catch (error) {
    console.error('updateListing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating listing',
      error: error.message
    });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the seller can delete this listing'
      });
    }

    await Listing.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('deleteListing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting listing',
      error: error.message
    });
  }
};

export const markAsSold = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the seller can mark this listing as sold'
      });
    }

    listing.status = 'sold';
    await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Listing marked as sold',
      listing
    });
  } catch (error) {
    console.error('markAsSold error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating listing status',
      error: error.message
    });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .populate('seller', 'name avatar neighborhood');

    return res.status(200).json({
      success: true,
      listings
    });
  } catch (error) {
    console.error('getMyListings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving your listings',
      error: error.message
    });
  }
};

export const expressInterest = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot express interest in your own listing'
      });
    }

    const notification = new Notification({
      recipient: listing.seller,
      sender: req.user._id,
      type: 'listing_interest',
      referenceId: listing._id,
      message: `${req.user.name} expressed interest in your listing "${listing.title}".`
    });
    await notification.save();
    await notification.populate('sender', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to(`user:${listing.seller}`).emit('new_notification', notification);
    }

    return res.status(200).json({
      success: true,
      message: 'Interest expressed successfully. The seller has been notified.'
    });
  } catch (error) {
    console.error('expressInterest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error expressing interest in listing',
      error: error.message
    });
  }
};
