const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_pro';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing collections...');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      name: 'Ayush Sharma',
      email: 'admin@taskflow.pro',
      password: hashedPassword,
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ayush%20Sharma&backgroundType=gradientLinear'
    });

    const manager = await User.create({
      name: 'Sarah Connor',
      email: 'manager@taskflow.pro',
      password: hashedPassword,
      role: 'manager',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Connor&backgroundType=gradientLinear'
    });

    const developer = await User.create({
      name: 'Rahul Verma',
      email: 'dev@taskflow.pro',
      password: hashedPassword,
      role: 'member',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Rahul%20Verma&backgroundType=gradientLinear'
    });

    const designer = await User.create({
      name: 'Emma Stone',
      email: 'designer@taskflow.pro',
      password: hashedPassword,
      role: 'member',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Emma%20Stone&backgroundType=gradientLinear'
    });

    console.log('Seeded users: admin@taskflow.pro, manager@taskflow.pro, dev@taskflow.pro, designer@taskflow.pro (Password: password123)');

    // 2. Create Project
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    const project = await Project.create({
      name: 'E-Commerce Platform Replatforming',
      description: 'Migrating legacy shopping site to modern high-performance React + Express stack, adding stripe payments, real-time analytics dashboard, and smart features.',
      startDate,
      endDate,
      priority: 'high',
      createdBy: manager._id,
      members: [admin._id, manager._id, developer._id, designer._id]
    });

    console.log(`Seeded Project: "${project.name}"`);

    // 3. Create Tasks
    const tasks = [
      {
        title: 'Design Authentication Wireframes & Layouts',
        description: 'Establish look-and-feel of register, login, profile pages, and mobile responsive dashboard mockups.',
        projectId: project._id,
        assignedTo: designer._id,
        status: 'done',
        priority: 'medium',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        history: [
          { action: 'Created task', performedBy: manager._id },
          { action: 'Changed status from "backlog" to "todo"', performedBy: manager._id },
          { action: 'Changed status from "todo" to "in_progress"', performedBy: designer._id },
          { action: 'Changed status from "in_progress" to "testing"', performedBy: designer._id },
          { action: 'Changed status from "testing" to "done"', performedBy: manager._id }
        ]
      },
      {
        title: 'User Registration & JWT Authorization API',
        description: 'Build backend routes, hashing functions for credentials, sign token payload, and implement verification middlewares.',
        projectId: project._id,
        assignedTo: developer._id,
        status: 'done',
        priority: 'critical',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        history: [
          { action: 'Created task', performedBy: manager._id },
          { action: 'Changed status from "backlog" to "todo"', performedBy: developer._id },
          { action: 'Changed status from "todo" to "in_progress"', performedBy: developer._id },
          { action: 'Changed status from "in_progress" to "done"', performedBy: developer._id }
        ]
      },
      {
        title: 'Build Dashboard Layout & Recharts Widgets',
        description: 'Wire up total counters, pie chart for tasks distribution, and line graphs showing user velocity reports.',
        projectId: project._id,
        assignedTo: developer._id,
        status: 'testing',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        history: [
          { action: 'Created task', performedBy: manager._id },
          { action: 'Changed status from "backlog" to "in_progress"', performedBy: developer._id },
          { action: 'Changed status from "in_progress" to "testing"', performedBy: developer._id }
        ]
      },
      {
        title: 'Stripe Gateway & Cart Webhook Handlers',
        description: 'Integrate external checkout session SDK, handle webhook response codes, and configure order fullfilment schemas.',
        projectId: project._id,
        assignedTo: developer._id,
        status: 'in_progress',
        priority: 'critical',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // OVERDUE (2 days ago)
        history: [
          { action: 'Created task', performedBy: manager._id },
          { action: 'Changed status from "backlog" to "todo"', performedBy: manager._id },
          { action: 'Changed status from "todo" to "in_progress"', performedBy: developer._id }
        ]
      },
      {
        title: 'Set up Production CI/CD Pipelines',
        description: 'Configure automated actions to build bundle, run lint analysis, run unit tests, and publish to cloud hosting.',
        projectId: project._id,
        assignedTo: admin._id,
        status: 'todo',
        priority: 'low',
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        history: [
          { action: 'Created task', performedBy: admin._id }
        ]
      },
      {
        title: 'Rewrite Landing Page Marketing Copy',
        description: 'Optimize keyword rankings, define primary features lists, and improve conversions by reviewing calls to actions.',
        projectId: project._id,
        assignedTo: designer._id,
        status: 'backlog',
        priority: 'low',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        history: [
          { action: 'Created task', performedBy: manager._id }
        ]
      }
    ];

    const seededTasks = await Task.insertMany(tasks);
    console.log(`Seeded ${seededTasks.length} Tasks across backlog, todo, in_progress, testing, done.`);

    // 4. Create Comments
    await Comment.create({
      taskId: seededTasks[0]._id, // Auth Wireframes
      userId: developer._id,
      message: 'Looks clean Emma. Can we ensure the input boxes have proper active-focus styles?'
    });

    await Comment.create({
      taskId: seededTasks[0]._id, // Auth Wireframes
      userId: designer._id,
      message: 'Yes! Added focus ring states with Indigo-500 styling. Updated mockups in Figma.'
    });

    await Comment.create({
      taskId: seededTasks[3]._id, // Stripe Checkout
      userId: manager._id,
      message: 'Ayush, please double check webhook keys are stored in Vault/env files, not code!'
    });

    console.log('Seeded comments thread...');

    // 5. Create a Notification
    await Notification.create({
      userId: developer._id,
      message: 'Sarah Connor assigned you a task: Stripe Gateway & Cart Webhook Handlers',
      isRead: false
    });

    console.log('Seeded notifications...');

    console.log('Database Seeding Completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
