import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toast: null,
  modal: null,
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    openModal: (state, action) => {
      state.modal = action.payload;
    },
    closeModal: (state) => {
      state.modal = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { showToast, clearToast, openModal, closeModal, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
