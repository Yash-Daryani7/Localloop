import ServiceRequest from '../models/ServiceRequest.model.js';
import Notification from '../models/Notification.model.js';
import { notifyNeighborhood } from '../utils/notifyNeighborhood.js';
import { getIO } from '../socket.js';

export const createServiceRequest = async (req, res) => {
  try {
    const { title, description, type, category, neighborhood, budget } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and type (offer or request) are required.'
      });
    }

    const serviceNeighborhood = neighborhood || req.user.neighborhood;
    if (!serviceNeighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required.'
      });
    }

    const service = new ServiceRequest({
      title,
      description,
      type,
      category: category || 'Other',
      postedBy: req.user._id,
      neighborhood: serviceNeighborhood,
      budget: budget || '',
      status: 'open',
      responses: []
    });

    await service.save();
    await service.populate('postedBy', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to(`neighborhood:${service.neighborhood}`).emit('service_created', service);
    }

    await notifyNeighborhood({
      neighborhood: service.neighborhood,
      sender: req.user._id,
      type: 'new_service',
      referenceId: service._id,
      message: `${req.user.name} shared a service post: "${service.title}".`
    });

    return res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      service
    });
  } catch (error) {
    console.error('createServiceRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating service request',
      error: error.message
    });
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const {
      type,
      category,
      neighborhood,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (neighborhood) query.neighborhood = neighborhood;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, totalServices] = await Promise.all([
      ServiceRequest.find(query)
        .populate('postedBy', 'name avatar neighborhood')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceRequest.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      services,
      totalServices,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalServices / parseInt(limit))
    });
  } catch (error) {
    console.error('getServiceRequests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving service requests',
      error: error.message
    });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const service = await ServiceRequest.findById(req.params.id)
      .populate('postedBy', 'name avatar email neighborhood bio')
      .populate('responses.user', 'name avatar neighborhood');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    return res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    console.error('getServiceById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving service details',
      error: error.message
    });
  }
};

export const respondToService = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Response message cannot be empty'
      });
    }

    const service = await ServiceRequest.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    if (service.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This service request is already closed'
      });
    }

    const newResponse = {
      user: req.user._id,
      message: message.trim(),
      createdAt: new Date()
    };

    service.responses.push(newResponse);
    await service.save();
    await service.populate('responses.user', 'name avatar neighborhood');

    // Notify author if responder is not the author
    if (service.postedBy.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: service.postedBy,
        sender: req.user._id,
        type: 'service_response',
        referenceId: service._id,
        message: `${req.user.name} responded to your service post: "${service.title}".`
      });
      await notification.save();
      await notification.populate('sender', 'name avatar neighborhood');

      const io = getIO();
      if (io) {
        io.to(`user:${service.postedBy}`).emit('new_notification', notification);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Response added successfully',
      service
    });
  } catch (error) {
    console.error('respondToService error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error responding to service request',
      error: error.message
    });
  }
};

export const closeService = async (req, res) => {
  try {
    const service = await ServiceRequest.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    if (service.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the author can close this service request'
      });
    }

    service.status = 'closed';
    await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service request closed successfully',
      service
    });
  } catch (error) {
    console.error('closeService error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error closing service request',
      error: error.message
    });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await ServiceRequest.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    if (service.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the author can delete this service request'
      });
    }

    await ServiceRequest.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Service request deleted successfully'
    });
  } catch (error) {
    console.error('deleteService error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting service request',
      error: error.message
    });
  }
};
