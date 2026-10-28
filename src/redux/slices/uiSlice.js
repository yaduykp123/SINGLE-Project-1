import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expireoff-theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  } catch {
    return "light";
  }
};

const initialState = {
  toast: null,
  modal: null,
  sidebarOpen: false,
  theme: getInitialTheme(),
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
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const {
  showToast,
  clearToast,
  openModal,
  closeModal,
  toggleSidebar,
  toggleTheme,
  setTheme,
} = uiSlice.actions;
export default uiSlice.reducer;
