import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cart: null,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action) => {
      state.cart = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCartLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCartError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearCartState: (state) => {
      state.cart = { items: [], totalAmount: 0, itemCount: 0 };
    },
    optimisticAddToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload || {};
      if (!state.cart) {
        state.cart = { items: [], totalAmount: 0, itemCount: 0 };
      }
      const unitPrice = product?.discountPrice || product?.marketPrice || 0;
      const existingItem = state.cart.items?.find(
        (i) =>
          i.product?._id === product?._id ||
          i.product === product?._id ||
          i._id === product?._id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      } else if (product) {
        state.cart.items = state.cart.items || [];
        state.cart.items.push({
          _id: `temp_${Date.now()}`,
          product,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
        });
      }

      state.cart.itemCount = (state.cart.items || []).reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.cart.totalAmount = (state.cart.items || []).reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
    },
    optimisticRemoveFromCart: (state, action) => {
      const itemId = action.payload;
      if (!state.cart?.items) return;
      state.cart.items = state.cart.items.filter(
        (item) => item._id !== itemId && item.product?._id !== itemId
      );
      state.cart.itemCount = state.cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.cart.totalAmount = state.cart.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
    },
    optimisticUpdateQuantity: (state, action) => {
      const { itemId, type } = action.payload || {};
      if (!state.cart?.items) return;
      const item = state.cart.items.find((i) => i._id === itemId);
      if (!item) return;

      if (type === "increase") {
        item.quantity += 1;
        item.totalPrice = item.quantity * item.unitPrice;
      } else if (type === "decrease") {
        if (item.quantity > 1) {
          item.quantity -= 1;
          item.totalPrice = item.quantity * item.unitPrice;
        }
      }

      state.cart.itemCount = state.cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.cart.totalAmount = state.cart.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
    },
  },
});

export const {
  setCart,
  setCartLoading,
  setCartError,
  clearCartState,
  optimisticAddToCart,
  optimisticRemoveFromCart,
  optimisticUpdateQuantity,
} = cartSlice.actions;
export default cartSlice.reducer;