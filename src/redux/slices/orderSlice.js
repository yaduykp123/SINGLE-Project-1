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
      state.myOrders.unshift(action.payload);
    },
    updateOrderStatusInState: (state, action) => {
      const { orderId, status } = action.payload;
      state.receivedOrders = state.receivedOrders.map((o) =>
        o._id === orderId ? { ...o, status } : o
      );
      state.myOrders = state.myOrders.map((o) =>
        o._id === orderId ? { ...o, status } : o
      );
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
  },
});

export const {
  setMyOrders,
  setReceivedOrders,
  addOrder,
  updateOrderStatusInState,
  setOrderLoading,
  setOrderError,
  clearOrderError,
} = orderSlice.actions;

export default orderSlice.reducer;
