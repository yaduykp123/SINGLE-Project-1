import axiosInstance from "../../api/axiosInstance";
import {
  setCredentials,
  setOtpUserId,
  setResetEmail,
  clearCredentials,
  setLoading,
  setError,
 updateUserLocation as updateUserLocationAction
} from "../slices/authSlice";
import toast from "react-hot-toast";

// Register User
export const registerUser = (formData, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.post("/auth/register", formData);
    dispatch(setOtpUserId(data.userId));
    toast.success("Verification code sent to your email!");
    navigate("/verify-otp");
  } catch (error) {
    const msg = error.response?.data?.message || "Registration could not be completed. Please try again.";
    dispatch(setError(msg));
    toast.error(msg);
  }
};

// Verify OTP
export const verifyOTP = (userId, otp, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.post("/auth/verify-otp", { userId, otp });
    dispatch(setCredentials({ token: data.token, user: data.user }));
    toast.success("Email verified! Welcome to expireOff.");
    if (data.user?.isAdmin) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  } catch (error) {
    const msg = error.response?.data?.message || "Invalid or expired verification code. Please try again.";
    dispatch(setError(msg));
    toast.error(msg);
  }
};

// Resend OTP
export const resendOTP = (userId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    await axiosInstance.post("/auth/resend-otp", { userId });
    toast.success("New verification code sent to your email!");
    dispatch(setLoading(false));
  } catch (error) {
    const msg = error.response?.data?.message || "Unable to resend verification code right now. Please try again.";
    dispatch(setError(msg));
    toast.error(msg);
  }
};

// Login User
export const loginUser = (formData, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.post("/auth/login", formData);
    dispatch(setCredentials({ token: data.token, user: data.user }));
    toast.success("Welcome back!");
    if (data.user?.isAdmin) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  } catch (error) {
    const msg = error.response?.data?.message || "Incorrect email or password. Please try again.";
    dispatch(setError(msg));
    toast.error(msg);
  }
};

 
// ---- Forgot / Reset Password ----
 
// Step 1: request a reset code to be emailed to the user
export const forgotPassword = (email, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.post("/auth/forgot-password", { email });
    dispatch(setResetEmail(email));
    toast.success(data.message || "If an account exists, a reset code has been sent to that email.");
    navigate("/reset-password");
  } catch (error) {
    const msg = error.response?.data?.message || "Could not process your request. Please try again.";
    dispatch(setError(msg));
    toast.error(msg);
  } finally {
    dispatch(setLoading(false));
  }
};
 

// Step 2: submit the code + new password
export const resetPassword = ({ email, otp, newPassword }, navigate) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.post("/auth/reset-password", { email, otp, newPassword });
    toast.success(data.message || "Password reset successful! Please log in.");
    navigate("/login");
    // Clear resetEmail *after* navigating away. ResetPassword.jsx has a guard
    // effect that redirects to /forgot-password whenever resetEmail becomes
    // empty — clearing it before navigating can race with navigate("/login")
    // and send the user to the wrong page. The setTimeout pushes this to the
    // next tick, after the route has already changed.
    setTimeout(() => dispatch(setResetEmail(null)), 0);
  } catch (error) {
    const msg = error.response?.data?.message || "Invalid or expired code. Please try again.";
    dispatch(setError(msg));
    toast.error(msg);
  } finally {
    dispatch(setLoading(false));
  }
};
 
// Resend the reset code (reuses the same forgot-password endpoint)
export const resendResetOTP = (email) => async (dispatch) => {
  try {
    await axiosInstance.post("/auth/forgot-password", { email });
    toast.success("A new reset code has been sent to your email!");
  } catch (error) {
    const msg = error.response?.data?.message || "Unable to resend code right now. Please try again.";
    toast.error(msg);
  }
};
 

// Check Auth (on app load)
export const checkAuth = () => async (dispatch) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  dispatch(setLoading(true));
  try {
    const { data } = await axiosInstance.get("/auth/me");
    dispatch(setCredentials({ token, user: data }));
  } catch (error) {
    dispatch(clearCredentials());
  }
};

// Logout
export const logoutUser = (navigate) => async (dispatch) => {
  try {
    await axiosInstance.post("/auth/logout");
  } catch {
    // Silent catch if server is unreachable
  } finally {
    dispatch(clearCredentials());
    toast.success("Logged out successfully");
    if (navigate) navigate("/login");
  }
};

// Update Location
export const updateUserLocation = (locationData) => async (dispatch) => {
  // Optimistically update Redux state and localStorage so the UI updates instantly
  dispatch(updateUserLocationAction(locationData));
  toast.success("Location updated!");

  try {
    const { data } = await axiosInstance.put("/users/location", locationData);
    if (data?.user) {
      dispatch(updateUserLocationAction(data.user));
    }
  } catch {
    // Silent fail for background location sync
  }
};
