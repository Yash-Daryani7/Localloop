import express from 'express';
import {
  createPoll,
  getPolls,
  getPollById,
  votePoll,
  getResults,
  deletePoll
} from '../controllers/poll.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getPolls);
router.post('/', isAuthenticated, createPoll);

router.get('/:id', isAuthenticated, getPollById);
router.post('/:id/vote', isAuthenticated, votePoll);
router.get('/:id/results', isAuthenticated, getResults);
router.delete('/:id', isAuthenticated, deletePoll);

export default router;
