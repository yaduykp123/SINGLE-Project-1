import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  myOrders: [],
  receivedOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
      state.loading = false;
    },
    setReceivedOrders: (state, action) => {
      state.receivedOrders = action.payload;
      state.loading = false;
    },
    addOrder: (state, action) => {
      const newOrder = action.payload;
      if (!newOrder?._id) return;
      const idStr = newOrder._id.toString();
      const exists = state.myOrders.some((o) => o._id?.toString() === idStr);
      if (!exists) {
        state.myOrders.unshift(newOrder);
      }
    },
    addReceivedOrder: (state, action) => {
      const newOrder = action.payload;
      if (!newOrder?._id) return;
      const idStr = newOrder._id.toString();
      const exists = state.receivedOrders.some((o) => o._id?.toString() === idStr);
      if (!exists) {
        state.receivedOrders.unshift(newOrder);
      }
    },
    updateOrderStatusInState: (state, action) => {
      const { orderId, status, order } = action.payload;
      const idStr = orderId?.toString();
      state.receivedOrders = state.receivedOrders.map((o) => {
        if (o._id?.toString() === idStr || o._id === orderId) {
          return order ? { ...o, ...order, status } : { ...o, status };
        }
        return o;
      });
      state.myOrders = state.myOrders.map((o) => {
        if (o._id?.toString() === idStr || o._id === orderId) {
          return order ? { ...o, ...order, status } : { ...o, status };
        }
        return o;
      });
    },
    setOrderLoading: (state, action) => {
      state.loading = action.payload;
    },
    setOrderError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
    removeOrderFromState: (state, action) => {
      const orderId = action.payload;
      state.myOrders = state.myOrders.filter((o) => o._id !== orderId);
      state.receivedOrders = state.receivedOrders.filter((o) => o._id !== orderId);
    },
    clearMyOrdersFromState: (state, action) => {
      const mode = action.payload; // 'all' or 'cancelled'
      if (mode === "all") {
        state.myOrders = [];
      } else {
        state.myOrders = state.myOrders.filter((o) => o.status !== "cancelled");
      }
    },
  },
});

export const {
  setMyOrders,
  setReceivedOrders,
  addOrder,
  addReceivedOrder,
  updateOrderStatusInState,
  setOrderLoading,
  setOrderError,
  clearOrderError,
  removeOrderFromState,
  clearMyOrdersFromState,
} = orderSlice.actions;

export default orderSlice.reducer;
