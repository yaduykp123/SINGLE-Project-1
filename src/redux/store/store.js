import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import productReducer from "../slices/productSlice";
import orderReducer from "../slices/orderSlice";
import uiReducer from "../slices/uiSlice";
import offerReducer from "../slices/offerSlice";
import notificationReducer from "../slices/notificationSlice";
import cartReducer from "../slices/cartSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    order: orderReducer,
    ui: uiReducer,
    offers: offerReducer,
    notifications: notificationReducer,
      cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/setUser"],
      },
    }),
});
