import axiosInstance from "../../api/axiosInstance";
import {
  setNotifications,
  markSingleAsRead,
  markAllAsReadState,
  setNotificationLoading,
  setNotificationError,
} from "../slices/notificationSlice";

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
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = () => async (dispatch) => {
  try {
    dispatch(markAllAsReadState());
    await axiosInstance.put("/notifications/read-all");
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
};
