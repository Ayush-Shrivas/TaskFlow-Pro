const Notification = require('../models/Notification');

const triggerNotification = async (req, userId, message) => {
  try {
    // Save to MongoDB
    const notification = await Notification.create({
      userId,
      message,
      isRead: false
    });

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Send to the user's private room (room named by userId)
      io.to(userId.toString()).emit('notificationReceived', {
        _id: notification._id,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      });
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating/triggering notification:', error.message);
  }
};

module.exports = { triggerNotification };
