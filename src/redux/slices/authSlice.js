import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  const saved = localStorage.getItem("user");
  return saved ? JSON.parse(saved) : null;
};

const initialState = {
  user: getInitialUser(),
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
  otpUserId: null,
  resetEmail: null, // NEW: holds the email while the user is in the forgot/reset-password flow
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.removeItem("locationAutoPrompted");
    },
    setOtpUserId: (state, action) => {
      state.otpUserId = action.payload;
      state.loading = false;
    },

       // NEW: tracks which email is currently going through forgot/reset password
    setResetEmail: (state, action) => {
      state.resetEmail = action.payload;
      state.loading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.otpUserId = null;
         state.resetEmail = null;
      state.loading = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("locationAutoPrompted");
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateUserLocation: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCredentials,
  setOtpUserId,
    setResetEmail,
  clearCredentials,
  setLoading,
  setError,
  updateUserLocation,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
