import axiosInstance from "../../api/axiosInstance";
import {
  setNotifications,
  markSingleAsRead,
  markAllAsReadState,
  setNotificationLoading,
  setNotificationError,
  removeNotificationFromState,
  clearAllNotificationsState,
} from "../slices/notificationSlice";
import toast from "react-hot-toast";

// Fetch user notifications from API
export const fetchNotifications = () => async (dispatch) => {
  try {
    dispatch(setNotificationLoading(true));
    const res = await axiosInstance.get("/notifications");
    if (res.data.success) {
      dispatch(
        setNotifications({
          notifications: res.data.notifications,
          unreadCount: res.data.unreadCount,
        })
      );
    }
  } catch (error) {
    dispatch(
      setNotificationError(
        error.response?.data?.message || "Failed to fetch notifications"
      )
    );
  }
};

// Mark single notification as read
export const markNotificationRead = (id) => async (dispatch) => {
  try {
    dispatch(markSingleAsRead(id));
    await axiosInstance.put(`/notifications/${id}/read`);
  } catch {
    // Silent fail for notification read sync
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = () => async (dispatch) => {
  try {
    dispatch(markAllAsReadState());
    await axiosInstance.put("/notifications/read-all");
  } catch {
    // Silent fail for notification read sync
  }
};

// Delete single notification
export const deleteNotificationThunk = (id) => async (dispatch) => {
  try {
    dispatch(removeNotificationFromState(id));
    await axiosInstance.delete(`/notifications/${id}`);
    toast.success("Notification deleted");
  } catch {
    toast.error("Failed to delete notification");
  }
};

// Clear all notifications
export const clearAllNotificationsThunk = () => async (dispatch) => {
  try {
    dispatch(clearAllNotificationsState());
    await axiosInstance.delete("/notifications/clear");
    toast.success("All notifications cleared");
  } catch {
    toast.error("Failed to clear notifications");
  }
};
