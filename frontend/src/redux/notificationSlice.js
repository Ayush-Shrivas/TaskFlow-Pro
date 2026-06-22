import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markRead: (state, action) => {
      state.notifications = state.notifications.map(n => 
        n._id === action.payload ? { ...n, isRead: true } : n
      );
      state.unreadCount = Math.max(0, state.notifications.filter(n => !n.isRead).length);
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    }
  }
});

export const {
  setNotifications,
  addNotification,
  markRead,
  markAllRead
} = notificationSlice.actions;

export default notificationSlice.reducer;
