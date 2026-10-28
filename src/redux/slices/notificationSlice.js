import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      const raw = action.payload?.notifications || [];
      const uniqueMap = new Map();
      raw.forEach((n) => {
        if (n && n._id) uniqueMap.set(n._id, n);
      });
      state.notifications = Array.from(uniqueMap.values());
      state.unreadCount = typeof action.payload?.unreadCount === "number"
        ? action.payload.unreadCount
        : state.notifications.filter((n) => !n.isRead).length;
      state.loading = false;
    },
    addNotification: (state, action) => {
      const newNotif = action.payload;
      if (!newNotif?._id) return;
      const index = state.notifications.findIndex((n) => n._id?.toString() === newNotif._id?.toString());
      if (index === -1) {
        state.notifications.unshift(newNotif);
        if (!newNotif.isRead) {
          state.unreadCount += 1;
        }
      } else {
        // Update existing notification in-place
        state.notifications[index] = { ...state.notifications[index], ...newNotif };
      }
    },
    markSingleAsRead: (state, action) => {
      const id = action.payload;
      const notif = state.notifications.find((n) => n._id === id);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsReadState: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    setNotificationLoading: (state, action) => {
      state.loading = action.payload;
    },
    setNotificationError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    removeNotificationFromState: (state, action) => {
      const id = action.payload;
      const target = state.notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n._id !== id);
    },
    clearAllNotificationsState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markSingleAsRead,
  markAllAsReadState,
  setNotificationLoading,
  setNotificationError,
  removeNotificationFromState,
  clearAllNotificationsState,
} = notificationSlice.actions;

export default notificationSlice.reducer;
