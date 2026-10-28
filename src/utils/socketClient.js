import { io } from "socket.io-client";
import { addOrder, addReceivedOrder, updateOrderStatusInState } from "../redux/slices/orderSlice";
import { addNotification } from "../redux/slices/notificationSlice";
import { addOffer, removeOffer } from "../redux/slices/offerSlice";

let socketInstance = null;
let activeUserId = null;

/**
 * Returns the active socket instance.
 */
export const getSocket = () => socketInstance;

/**
 * Initializes and connects the singleton Socket.io client.
 * Subscribes to real-time events and patches Redux state cleanly without full-page refetches.
 *
 * @param {Function} dispatch Redux dispatch function
 * @param {Object} user Current authenticated user
 */
export const initSocketClient = (dispatch, user) => {
  if (!user || !user._id) {
    disconnectSocketClient();
    return null;
  }

  const userIdStr = user._id.toString();

  // If already connected for this user, reuse the active socket
  if (socketInstance && activeUserId === userIdStr && socketInstance.connected) {
    return socketInstance;
  }

  // If connected for a different user, cleanly disconnect first
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  activeUserId = userIdStr;
  const token = localStorage.getItem("token");
  const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const socketBaseUrl = rawApiUrl.replace(/\/api\/?$/, "");

  socketInstance = io(socketBaseUrl, {
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  const joinPrivateRoom = () => {
    if (socketInstance && userIdStr) {
      socketInstance.emit("join_room", userIdStr);
    }
  };

  socketInstance.on("connect", () => {
    joinPrivateRoom();
  });

  socketInstance.on("reconnect", () => {
    joinPrivateRoom();
  });

  // 1. REAL-TIME: Order created
  socketInstance.on("order_created", (payload) => {
    if (!payload?.order) return;

    const sellerId = payload.sellerId?.toString();
    const buyerId = payload.buyerId?.toString();

    // If current user is the seller, add to receivedOrders immediately
    if (sellerId === userIdStr || user.accountType === "shop") {
      dispatch(addReceivedOrder(payload.order));
    }

    // If current user is the buyer, add to myOrders immediately
    if (buyerId === userIdStr) {
      dispatch(addOrder(payload.order));
    }
  });

  // 2. REAL-TIME: Order status updated
  socketInstance.on("order_updated", (payload) => {
    if (payload?.orderId && payload?.status) {
      dispatch(
        updateOrderStatusInState({
          orderId: payload.orderId,
          status: payload.status,
          order: payload.order,
        })
      );
    }
  });

  // 3. REAL-TIME: New notification received
  socketInstance.on("new_notification", (notification) => {
    if (!notification) return;
    dispatch(addNotification(notification));
  });

  // 4. REAL-TIME: New promotional offer broadcast
  socketInstance.on("new_offer", (offer) => {
    if (offer) {
      dispatch(addOffer(offer));
    }
  });

  // 5. REAL-TIME: Offer deleted or deactivated
  socketInstance.on("offer_deleted", (payload) => {
    if (payload?.offerId) {
      dispatch(removeOffer(payload.offerId));
    }
  });

  return socketInstance;
};

/**
 * Cleanly disconnects the active socket connection and cleans up references.
 */
export const disconnectSocketClient = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    activeUserId = null;
  }
};
