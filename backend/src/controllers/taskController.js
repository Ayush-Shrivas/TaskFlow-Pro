const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { triggerNotification } = require('../utils/notification');

// Get all tasks for a specific project
const getTasks = async (req, res) => {
  const { projectId } = req.query;

  try {
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email role avatar')
      .populate('history.performedBy', 'name email role avatar')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single task by id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role avatar')
      .populate('history.performedBy', 'name email role avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a Task
const createTask = async (req, res) => {
  const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = new Task({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      status: status || 'backlog',
      priority: priority || 'medium',
      dueDate,
      history: [{
        action: 'Created task',
        performedBy: req.user._id
      }]
    });

    const savedTask = await task.save();
    
    // Populate assignee details
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('history.performedBy', 'name email role avatar');

    // Notify assignee if assigned
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await triggerNotification(
        req,
        assignedTo,
        `${req.user.name} assigned you the task: "${title}"`
      );
    }

    // Emit Socket event to all project workspace members
    const io = req.app.get('io');
    if (io) {
      io.to(projectId.toString()).emit('taskCreated', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    const historyActions = [];

    // Track status change
    if (status && status !== task.status) {
      historyActions.push({
        action: `Changed status from "${task.status}" to "${status}"`,
        performedBy: req.user._id
      });
      task.status = status;

      // Notify project manager or assignee if completed
      if (status === 'done') {
        const project = await Project.findById(task.projectId);
        if (project && project.createdBy.toString() !== req.user._id.toString()) {
          await triggerNotification(
            req,
            project.createdBy,
            `Task completed: "${task.title}" by ${req.user.name}`
          );
        }
      }
    }

    // Track assignee change
    if (assignedTo !== undefined && String(assignedTo) !== String(task.assignedTo)) {
      const oldAssigneeId = task.assignedTo;
      task.assignedTo = assignedTo || null;

      let assigneeName = 'Unassigned';
      if (assignedTo) {
        const user = await User.findById(assignedTo);
        assigneeName = user ? user.name : 'Unknown';

        // Notify new assignee
        if (String(assignedTo) !== String(req.user._id)) {
          await triggerNotification(
            req,
            assignedTo,
            `${req.user.name} assigned you the task: "${task.title}"`
          );
        }
      }

      historyActions.push({
        action: `Assigned task to ${assigneeName}`,
        performedBy: req.user._id
      });
    }

    // Track priority change
    if (priority && priority !== task.priority) {
      historyActions.push({
        action: `Changed priority from "${task.priority}" to "${priority}"`,
        performedBy: req.user._id
      });
      task.priority = priority;
    }

    // Track title/desc change
    if (title && title !== task.title) {
      historyActions.push({
        action: `Renamed task title to "${title}"`,
        performedBy: req.user._id
      });
      task.title = title;
    }

    if (description !== undefined && description !== task.description) {
      historyActions.push({
        action: 'Updated task description',
        performedBy: req.user._id
      });
      task.description = description;
    }

    // Track due date change
    if (dueDate && new Date(dueDate).getTime() !== new Date(task.dueDate).getTime()) {
      const formattedDate = new Date(dueDate).toLocaleDateString();
      historyActions.push({
        action: `Changed due date to ${formattedDate}`,
        performedBy: req.user._id
      });
      task.dueDate = dueDate;
    }

    // Add tracking history items to subdocument list
    if (historyActions.length > 0) {
      task.history.push(...historyActions);
    }

    const updatedTask = await task.save();
    
    // Populate fields
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('history.performedBy', 'name email role avatar');

    // Emit Socket event to all project workspace members
    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId.toString()).emit('taskUpdated', populatedTask);
    }

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectId = task.projectId.toString();
    const taskTitle = task.title;

    await Task.findByIdAndDelete(req.params.id);

    // Emit Socket event
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('taskDeleted', req.params.id);
    }

    res.json({ message: `Task "${taskTitle}" removed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Attachment to Task
const addAttachment = async (req, res) => {
  const { name, url } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.attachments.push({
      name,
      url,
      uploadedBy: req.user._id
    });

    task.history.push({
      action: `Uploaded attachment: "${name}"`,
      performedBy: req.user._id
    });

    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('history.performedBy', 'name email role avatar');

    // Emit Socket event
    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId.toString()).emit('taskUpdated', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addAttachment
};
