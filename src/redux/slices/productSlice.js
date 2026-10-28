import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  featuredDeals: [],
  nearbyProducts: [],
  recommendations: [],
  brands: [],
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 24,
  hasMore: false,
  myListings: [],
  reminders: [],
  currentProduct: null,
  categories: ["All", "Grocery Items", "Fruits", "Vegetables", "Meat/Fish", "Dairy", "Bakery", "Other"],
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
      if (Array.isArray(action.payload)) {
        state.products = action.payload;
        state.total = action.payload.length;
        state.totalPages = 1;
        state.page = 1;
        state.hasMore = false;
      } else if (action.payload && Array.isArray(action.payload.products)) {
        state.products = action.payload.products;
        state.total = action.payload.total ?? action.payload.products.length;
        state.totalPages = action.payload.totalPages ?? 1;
        state.page = action.payload.page ?? 1;
        state.limit = action.payload.limit ?? 24;
        state.hasMore = Boolean(action.payload.hasMore);
      }
      state.loading = false;
    },
    setFeaturedDeals: (state, action) => {
      state.featuredDeals = Array.isArray(action.payload) ? action.payload : [];
    },
    setNearbyProducts: (state, action) => {
      state.nearbyProducts = Array.isArray(action.payload) ? action.payload : [];
    },
    setBrands: (state, action) => {
      state.brands = Array.isArray(action.payload) ? action.payload : [];
    },
    setRecommendations: (state, action) => {
      state.recommendations = Array.isArray(action.payload) ? action.payload : [];
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
      const targetId = updated.oldId || updated._id;
      state.products = state.products.map((p) =>
        p._id === targetId ? updated : p
      );
      state.myListings = state.myListings.map((p) =>
        p._id === targetId ? updated : p
      );
      if (state.currentProduct?._id === targetId) {
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
    clearExpiredProductsFromState: (state) => {
      const now = new Date();
      state.myListings = state.myListings.filter((p) => new Date(p.expiryDate) > now);
      state.products = state.products.filter((p) => new Date(p.expiryDate) > now);
      state.reminders = state.reminders.filter((p) => new Date(p.expiryDate) > now);
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
  setFeaturedDeals,
  setNearbyProducts,
  setBrands,
  setRecommendations,
  setMyListings,
  setReminders,
  setCurrentProduct,
  addProduct,
  updateProductInState,
  removeProduct,
  clearExpiredProductsFromState,
  setSelectedCategory,
  setFormOpen,
  setEditingProduct,
  setProductLoading,
  setProductError,
  clearProductError,
} = productSlice.actions;

export default productSlice.reducer;
