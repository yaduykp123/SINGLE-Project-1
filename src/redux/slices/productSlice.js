import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  myListings: [],
  reminders: [],
  currentProduct: null,
  categories: ["All", "Grocery Items", "Fruits", "Vegetables", "Meat/Fish", "Dairy", "Other"],
  selectedCategory: "All",
  loading: false,
  error: null,
  formOpen: false,
  editingProduct: null,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
      state.loading = false;
    },
    setMyListings: (state, action) => {
      state.myListings = action.payload;
      state.loading = false;
    },
    setReminders: (state, action) => {
      state.reminders = action.payload;
      state.loading = false;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
      state.loading = false;
    },
    addProduct: (state, action) => {
      state.products.unshift(action.payload);
      state.myListings.unshift(action.payload);
      state.loading = false;
    },
    updateProductInState: (state, action) => {
      const updated = action.payload;
      state.products = state.products.map((p) =>
        p._id === updated._id ? updated : p
      );
      state.myListings = state.myListings.map((p) =>
        p._id === updated._id ? updated : p
      );
      if (state.currentProduct?._id === updated._id) {
        state.currentProduct = updated;
      }
      state.loading = false;
    },
    removeProduct: (state, action) => {
      const id = action.payload;
      state.products = state.products.filter((p) => p._id !== id);
      state.myListings = state.myListings.filter((p) => p._id !== id);
      state.reminders = state.reminders.filter((p) => p._id !== id);
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setFormOpen: (state, action) => {
      state.formOpen = action.payload;
    },
    setEditingProduct: (state, action) => {
      state.editingProduct = action.payload;
      state.formOpen = !!action.payload;
    },
    setProductLoading: (state, action) => {
      state.loading = action.payload;
    },
    setProductError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearProductError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setProducts,
  setMyListings,
  setReminders,
  setCurrentProduct,
  addProduct,
  updateProductInState,
  removeProduct,
  setSelectedCategory,
  setFormOpen,
  setEditingProduct,
  setProductLoading,
  setProductError,
  clearProductError,
} = productSlice.actions;

export default productSlice.reducer;
