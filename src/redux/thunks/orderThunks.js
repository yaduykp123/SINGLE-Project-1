import axiosInstance from "../../api/axiosInstance";
import {
  setMyOrders,
  setReceivedOrders,
  addOrder,
  updateOrderStatusInState,
  setOrderLoading,
  setOrderError,
} from "../slices/orderSlice";
import toast from "react-hot-toast";

const cache = {
  myOrders: { data: null, timestamp: 0 },
  receivedOrders: { data: null, timestamp: 0 },
};
const CACHE_DURATION = 30 * 1000;

// Fetch my orders (as buyer) — WITH CACHE
export const fetchMyOrders = () => async (dispatch) => {
  const now = Date.now();
  
  if (cache.myOrders.data && (now - cache.myOrders.timestamp) < CACHE_DURATION) {
    dispatch(setMyOrders(cache.myOrders.data));
    return;
  }

  dispatch(setOrderLoading(true));
  try {
    const { data } = await axiosInstance.get("/orders/my-orders");
    cache.myOrders = { data, timestamp: now };
    dispatch(setMyOrders(data));
  } catch (error) {
    dispatch(setOrderError(error.response?.data?.message || "Unable to load your orders right now."));
  }
};

// Fetch received orders (as seller) — WITH CACHE
export const fetchReceivedOrders = () => async (dispatch) => {
  const now = Date.now();
  
  if (cache.receivedOrders.data && (now - cache.receivedOrders.timestamp) < CACHE_DURATION) {
    dispatch(setReceivedOrders(cache.receivedOrders.data));
    return;
  }

  dispatch(setOrderLoading(true));
  try {
    const { data } = await axiosInstance.get("/orders/received");
    cache.receivedOrders = { data, timestamp: now };
    dispatch(setReceivedOrders(data));
  } catch (error) {
    dispatch(setOrderError(error.response?.data?.message || "Unable to load store orders right now."));
  }
};

export const invalidateOrderCache = () => {
  cache.myOrders = { data: null, timestamp: 0 };
  cache.receivedOrders = { data: null, timestamp: 0 };
};

// Create Razorpay order
export const createRazorpayOrder = async (amount) => {
  const { data } = await axiosInstance.post("/orders/create-order", { amount });
  return data;
};

// Verify payment and place order
export const verifyAndPlaceOrder = (paymentData) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.post("/orders/verify-payment", paymentData);
    dispatch(addOrder(data.order));
    invalidateOrderCache(); // ✅ Clear cache
    toast.success("Order placed successfully!");
    return data.order;
  } catch (error) {
    toast.error(error.response?.data?.message || "Payment verification failed. Please try again.");
    throw error;
  }
};

// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    await axiosInstance.put(`/orders/${orderId}/status`, { status });
    dispatch(updateOrderStatusInState({ orderId, status }));
    invalidateOrderCache(); // ✅ Clear cache
    toast.success(`Order status updated to ${status}.`);
  } catch (error) {
    toast.error("Unable to update order status. Please try again.");
  }
};