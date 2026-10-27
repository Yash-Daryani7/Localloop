import Poll from '../models/Poll.model.js';
import Notification from '../models/Notification.model.js';
import { notifyNeighborhood } from '../utils/notifyNeighborhood.js';
import { getIO } from '../socket.js';

export const createPoll = async (req, res) => {
  try {
    const { question, options, neighborhood, expiresAt } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Question and at least 2 options are required.'
      });
    }

    if (!expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date (expiresAt) is required.'
      });
    }

    const pollNeighborhood = neighborhood || req.user.neighborhood;
    if (!pollNeighborhood) {
      return res.status(400).json({
        success: false,
        message: 'Neighborhood is required.'
      });
    }

    const formattedOptions = options.map((opt) => {
      const text = typeof opt === 'string' ? opt.trim() : opt.text?.trim();
      return { text, votes: [] };
    });

    if (formattedOptions.some((opt) => !opt.text)) {
      return res.status(400).json({
        success: false,
        message: 'All options must have non-empty text.'
      });
    }

    const poll = new Poll({
      question: question.trim(),
      options: formattedOptions,
      createdBy: req.user._id,
      neighborhood: pollNeighborhood,
      expiresAt: new Date(expiresAt)
    });

    await poll.save();
    await poll.populate('createdBy', 'name avatar neighborhood');

    const io = getIO();
    if (io) {
      io.to(`neighborhood:${poll.neighborhood}`).emit('poll_created', poll);
    }

    await notifyNeighborhood({
      neighborhood: poll.neighborhood,
      sender: req.user._id,
      type: 'new_poll',
      referenceId: poll._id,
      message: `${req.user.name} created a neighborhood poll: "${poll.question}".`
    });

    return res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('createPoll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating poll',
      error: error.message
    });
  }
};

export const getPolls = async (req, res) => {
  try {
    const { neighborhood } = req.query;
    const query = {};

    if (neighborhood) {
      query.neighborhood = neighborhood;
    }

    const polls = await Poll.find(query)
      .populate('createdBy', 'name avatar neighborhood')
      .populate('options.votes', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      polls
    });
  } catch (error) {
    console.error('getPolls error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving polls',
      error: error.message
    });
  }
};

export const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name avatar neighborhood')
      .populate('options.votes', 'name avatar');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    return res.status(200).json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('getPollById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving poll details',
      error: error.message
    });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { optionId, optionIndex } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll expired
    if (new Date() > new Date(poll.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'This poll has already expired'
      });
    }

    // Check if already voted in ANY option
    const alreadyVoted = poll.options.some((opt) =>
      opt.votes.some((v) => v.toString() === userId.toString())
    );

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    let targetOption = null;
    if (optionId) {
      targetOption = poll.options.id(optionId);
    } else if (optionIndex !== undefined && poll.options[optionIndex]) {
      targetOption = poll.options[optionIndex];
    }

    if (!targetOption) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected for vote'
      });
    }

    targetOption.votes.push(userId);
    await poll.save();
    await poll.populate('createdBy', 'name avatar neighborhood');
    await poll.populate('options.votes', 'name avatar');

    // Notify creator if voter is not creator
    if (poll.createdBy._id.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: poll.createdBy._id,
        sender: userId,
        type: 'poll_vote',
        referenceId: poll._id,
        message: `${req.user.name} voted on your poll "${poll.question}".`
      });
      await notification.save();
      await notification.populate('sender', 'name avatar neighborhood');

      const io = getIO();
      if (io) {
        io.to(`user:${poll.createdBy._id}`).emit('new_notification', notification);
      }
    }

    const io = getIO();
    if (io) {
      io.to(`neighborhood:${poll.neighborhood}`).emit('poll_updated', poll);
    }

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      poll
    });
  } catch (error) {
    console.error('votePoll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error recording vote',
      error: error.message
    });
  }
};

export const getResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name avatar neighborhood')
      .populate('options.votes', 'name avatar');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

    const results = {
      _id: poll._id,
      question: poll.question,
      neighborhood: poll.neighborhood,
      createdBy: poll.createdBy,
      expiresAt: poll.expiresAt,
      isExpired: new Date() > new Date(poll.expiresAt),
      totalVotes,
      options: poll.options.map((opt) => ({
        _id: opt._id,
        text: opt.text,
        voteCount: opt.votes.length,
        percentage: totalVotes > 0 ? ((opt.votes.length / totalVotes) * 100).toFixed(1) : 0,
        votes: opt.votes
      }))
    };

    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('getResults error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error getting poll results',
      error: error.message
    });
  }
};

export const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the creator can delete this poll'
      });
    }

    await Poll.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('deletePoll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting poll',
      error: error.message
    });
  }
};
