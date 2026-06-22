const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { triggerNotification } = require('../utils/notification');

// Get comments for a task
const getCommentsByTaskId = async (req, res) => {
  const { taskId } = req.params;

  try {
    const comments = await Comment.find({ taskId })
      .populate('userId', 'name email role avatar')
      .sort({ createdAt: 1 }); // Oldest first (chronological thread)

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment
const addComment = async (req, res) => {
  const { taskId, message } = req.body;

  try {
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      taskId,
      userId: req.user._id,
      message
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email role avatar');

    // Notify task assignee if the commenter is someone else
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await triggerNotification(
        req,
        task.assignedTo,
        `${req.user.name} commented on your task "${task.title}": "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`
      );
    }

    // Emit Socket.io update to project room
    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId.toString()).emit('commentAdded', {
        taskId,
        comment: populatedComment
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCommentsByTaskId,
  addComment
};
