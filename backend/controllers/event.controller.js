import Event from '../models/Event.model.js';
import Notification from '../models/Notification.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { notifyNeighborhood } from '../utils/notifyNeighborhood.js';
import { getIO } from '../socket.js';

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      location,
      address,
      lat,
      lng,
      maxAttendees,
      neighborhood
    } = req.body;

    if (!title || !description || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, date, and location are required.'
      });
    }

    const eventNeighborhood = (req.user.neighborhood || '').trim().toLowerCase();
    if (!eventNeighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required.'
      });
    }

    if (neighborhood && neighborhood.trim().toLowerCase() !== eventNeighborhood) {
      return res.status(403).json({
        success: false,
        message: 'You can only create events in your own neighborhood'
      });
    }

    // Upload images to Cloudinary if provided
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'localloop/events')
      );
      imageUrls = await Promise.all(uploadPromises);
    } else if (req.body.images) {
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const event = new Event({
      title,
      description,
      category: category || 'Community',
      date: new Date(date),
      time: time || '',
      location,
      address: address || '',
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      images: imageUrls,
      organizer: req.user._id,
      maxAttendees: maxAttendees ? Number(maxAttendees) : 100,
      neighborhood: eventNeighborhood,
      status: 'upcoming',
      attendees: [req.user._id] // Organizer automatically attends
    });

    await event.save();
    await event.populate('organizer', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      // Emit event_created to neighborhood room
      io.to(`neighborhood:${event.neighborhood}`).emit('event_created', event);
    }

    await notifyNeighborhood({
      neighborhood: event.neighborhood,
      sender: req.user._id,
      additionalRecipients: req.user.followers,
      type: 'new_event',
      referenceId: event._id,
      message: `${req.user.name} created a new event: "${event.title}".`
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('createEvent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating event',
      error: error.message
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const {
      neighborhood,
      category,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (neighborhood) {
      query.neighborhood = neighborhood;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, totalEvents] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'name avatar neighborhood')
        .sort({ date: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      events,
      totalEvents,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalEvents / parseInt(limit))
    });
  } catch (error) {
    console.error('getEvents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving events',
      error: error.message
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar email neighborhood bio')
      .populate('attendees', 'name avatar neighborhood');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    return res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('getEventById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching event details',
      error: error.message
    });
  }
};

export const rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const userIdStr = req.user._id.toString();
    const isAlreadyAttending = event.attendees.some(
      (attendeeId) => attendeeId.toString() === userIdStr
    );

    if (isAlreadyAttending) {
      return res.status(400).json({
        success: false,
        message: 'You have already RSVP’d to this event'
      });
    }

    if (event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Event is already at maximum capacity'
      });
    }

    event.attendees.push(req.user._id);
    await event.save();
    await event.populate('attendees', 'name avatar neighborhood');

    // Notify organizer if not self
    if (event.organizer.toString() !== userIdStr) {
      const notification = new Notification({
        recipient: event.organizer,
        sender: req.user._id,
        type: 'event_rsvp',
        referenceId: event._id,
        message: `${req.user.name} RSVP'd to your event "${event.title}".`
      });
      await notification.save();
      await notification.populate('sender', 'name avatar neighborhood');

      const io = getIO();
      if (io) {
        io.to(`user:${event.organizer}`).emit('new_notification', notification);
        io.to(`neighborhood:${event.neighborhood}`).emit('event_updated', event);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'RSVP successful',
      event
    });
  } catch (error) {
    console.error('rsvpEvent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while RSVPing to event',
      error: error.message
    });
  }
};

export const cancelRsvp = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const userIdStr = req.user._id.toString();
    event.attendees = event.attendees.filter(
      (attendeeId) => attendeeId.toString() !== userIdStr
    );

    await event.save();
    await event.populate('attendees', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to(`neighborhood:${event.neighborhood}`).emit('event_updated', event);
    }

    return res.status(200).json({
      success: true,
      message: 'RSVP canceled successfully',
      event
    });
  } catch (error) {
    console.error('cancelRsvp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error canceling RSVP',
      error: error.message
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the event organizer can update this event'
      });
    }

    const {
      title,
      description,
      category,
      date,
      time,
      location,
      address,
      lat,
      lng,
      maxAttendees,
      neighborhood,
      status
    } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (category) event.category = category;
    if (date) event.date = new Date(date);
    if (time !== undefined) event.time = time;
    if (location) event.location = location;
    if (address !== undefined) event.address = address;
    if (lat !== undefined) event.lat = lat ? Number(lat) : null;
    if (lng !== undefined) event.lng = lng ? Number(lng) : null;
    if (maxAttendees !== undefined) event.maxAttendees = Number(maxAttendees);
    if (neighborhood) event.neighborhood = neighborhood;
    if (status) event.status = status;

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'localloop/events')
      );
      const newUrls = await Promise.all(uploadPromises);
      event.images = [...event.images, ...newUrls];
    }

    await event.save();
    await event.populate('organizer', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to(`neighborhood:${event.neighborhood}`).emit('event_updated', event);
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('updateEvent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating event',
      error: error.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the event organizer can delete this event'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('deleteEvent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting event',
      error: error.message
    });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('organizer', 'name avatar neighborhood')
      .populate('attendees', 'name avatar neighborhood');

    return res.status(200).json({
      success: true,
      events
    });
  } catch (error) {
    console.error('getMyEvents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving your events',
      error: error.message
    });
  }
};
