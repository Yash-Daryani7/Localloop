import express from 'express';
import {
  createServiceRequest,
  getServiceRequests,
  getServiceById,
  respondToService,
  closeService,
  deleteService
} from '../controllers/service.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getServiceRequests);
router.post('/', isAuthenticated, createServiceRequest);

router.get('/:id', isAuthenticated, getServiceById);
router.post('/:id/respond', isAuthenticated, respondToService);
router.put('/:id/close', isAuthenticated, closeService);
router.delete('/:id', isAuthenticated, deleteService);

export default router;
