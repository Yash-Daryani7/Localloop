import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  rsvpEvent,
  cancelRsvp,
  updateEvent,
  deleteEvent,
  getMyEvents
} from '../controllers/event.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getEvents);
router.post('/', isAuthenticated, upload.array('images', 5), createEvent);
router.get('/my', isAuthenticated, getMyEvents);

router.get('/:id', isAuthenticated, getEventById);
router.put('/:id', isAuthenticated, upload.array('images', 5), updateEvent);
router.delete('/:id', isAuthenticated, deleteEvent);
router.post('/:id/rsvp', isAuthenticated, rsvpEvent);
router.post('/:id/cancel-rsvp', isAuthenticated, cancelRsvp);

export default router;
