const Project = require('../models/Project');
const { triggerNotification } = require('../utils/notification');

// Get all projects for a user
const getProjects = async (req, res) => {
  try {
    let projects;
    // Admins can see all projects; managers and members see projects they belong to
    if (req.user.role === 'admin') {
      projects = await Project.find({})
        .populate('createdBy', 'name email role avatar')
        .populate('members', 'name email role avatar');
    } else {
      projects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { members: req.user._id }
        ]
      })
        .populate('createdBy', 'name email role avatar')
        .populate('members', 'name email role avatar');
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single project details
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role avatar')
      .populate('members', 'name email role avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions
    if (
      req.user.role !== 'admin' &&
      project.createdBy._id.toString() !== req.user._id.toString() &&
      !project.members.some(member => member._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a Project (Admin or Project Manager)
const createProject = async (req, res) => {
  const { name, description, startDate, endDate, priority, members } = req.body;

  try {
    // Add the creator to project members list automatically if not included
    let projectMembers = members || [];
    if (!projectMembers.includes(req.user._id.toString())) {
      projectMembers.push(req.user._id);
    }

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      priority: priority || 'medium',
      createdBy: req.user._id,
      members: projectMembers
    });

    // Notify all other added members
    for (const memberId of projectMembers) {
      if (memberId.toString() !== req.user._id.toString()) {
        await triggerNotification(
          req,
          memberId,
          `${req.user.name} added you to a new project: "${name}"`
        );
      }
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Project
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only Admin or project creator/manager can edit the project
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { name, description, startDate, endDate, priority, members } = req.body;

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    project.priority = priority || project.priority;

    // Handle members update and notifications
    if (members) {
      const oldMembers = project.members.map(m => m.toString());
      project.members = members;

      // Find new members to notify them
      for (const mId of members) {
        if (!oldMembers.includes(mId.toString()) && mId.toString() !== req.user._id.toString()) {
          await triggerNotification(
            req,
            mId,
            `${req.user.name} added you to the project: "${project.name}"`
          );
        }
      }
    }

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only Admin or project creator can delete
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Notify project members before deletion
    for (const memberId of project.members) {
      if (memberId.toString() !== req.user._id.toString()) {
        await triggerNotification(
          req,
          memberId,
          `The project "${project.name}" has been deleted by ${req.user.name}`
        );
      }
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
