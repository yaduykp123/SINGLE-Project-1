import axiosInstance from "../../api/axiosInstance";
import {
  setProducts,
  setMyListings,
  setReminders,
  setCurrentProduct,
  addProduct,
  updateProductInState,
  removeProduct,
  setProductLoading,
  setProductError,
  setFormOpen,
  setEditingProduct,
} from "../slices/productSlice";
import toast from "react-hot-toast";


// ✅ Simple in-memory cache to prevent duplicate fetches
const cache = {
  products: { data: null, timestamp: 0, key: "" },
  myListings: { data: null, timestamp: 0 },
  reminders: { data: null, timestamp: 0 },
};
const CACHE_DURATION = 30 * 1000; // 30 seconds

const invalidateProductCache = () => {
  cache.products = { data: null, timestamp: 0, key: "" };
  cache.myListings = { data: null, timestamp: 0 };
  cache.reminders = { data: null, timestamp: 0 };
};


// Fetch products by location — WITH CACHE
export const fetchProducts = (longitude, latitude, category = "All") => async (dispatch, getState) => {
  const cacheKey = `${longitude},${latitude},${category}`;
  const now = Date.now();
  
  // ✅ Return cached data if fresh
  if (cache.products.data && cache.products.key === cacheKey && (now - cache.products.timestamp) < CACHE_DURATION) {
    dispatch(setProducts(cache.products.data));
    return;
  }

  dispatch(setProductLoading(true));
  try {
    const params = { longitude, latitude };
    if (category !== "All") params.category = category;
    const { data } = await axiosInstance.get("/products", { params });
    
    // ✅ Store in cache
    cache.products = { data, timestamp: now, key: cacheKey };
    dispatch(setProducts(data));
  } catch (error) {
    dispatch(setProductError(error.response?.data?.message || "Unable to load nearby products. Please refresh or try again."));
  }
};


// Fetch single product — WITH CACHE
export const fetchProductById = (id) => async (dispatch, getState) => {
  const { product: { currentProduct } } = getState();
  
  // ✅ Return cached if same product
  if (currentProduct?._id === id) {
    return; // Already loaded
  }

  dispatch(setProductLoading(true));
  try {
    const { data } = await axiosInstance.get(`/products/${id}`);
    dispatch(setCurrentProduct(data));
  } catch (error) {
    dispatch(setProductError(error.response?.data?.message || "Product unavailable or no longer listed."));
  }
};


// Fetch my listings — WITH CACHE
export const fetchMyListings = () => async (dispatch) => {
  const now = Date.now();
  
  if (cache.myListings.data && (now - cache.myListings.timestamp) < CACHE_DURATION) {
    dispatch(setMyListings(cache.myListings.data));
    return;
  }

  dispatch(setProductLoading(true));
  try {
    const { data } = await axiosInstance.get("/products/my-listings");
    cache.myListings = { data, timestamp: now };
    dispatch(setMyListings(data));
  } catch (error) {
    dispatch(setProductError(error.response?.data?.message || "Unable to load your listings right now."));
  }
};


// Fetch reminders — WITH CACHE
export const fetchReminders = () => async (dispatch) => {
  const now = Date.now();
  
  if (cache.reminders.data && (now - cache.reminders.timestamp) < CACHE_DURATION) {
    dispatch(setReminders(cache.reminders.data));
    return;
  }

  dispatch(setProductLoading(true));
  try {
    const { data } = await axiosInstance.get("/products/reminders");
    cache.reminders = { data, timestamp: now };
    dispatch(setReminders(data));
  } catch (error) {
    dispatch(setProductError(error.response?.data?.message || "Unable to load expiry reminders right now."));
  }
};

// Create product — invalidate cache on success
export const createProduct = (formData) => async (dispatch) => {
  dispatch(setProductLoading(true));
  try {
    const { data } = await axiosInstance.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(addProduct(data));
    dispatch(setFormOpen(false));
    invalidateProductCache(); // ✅ Clear cache so next fetch gets fresh data
    toast.success("Product listed successfully!");
  } catch (error) {
    const msg = error.response?.data?.message || "Could not post product. Please check details and try again.";
    dispatch(setProductError(msg));
    toast.error(msg);
  }
};

// Update product
export const updateProduct = (id, formData) => async (dispatch) => {
  dispatch(setProductLoading(true));
  try {
    const { data } = await axiosInstance.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(updateProductInState(data));
    dispatch(setEditingProduct(null));
    invalidateProductCache(); // ✅ Clear cache
    toast.success("Product updated successfully!");
  } catch (error) {
    const msg = error.response?.data?.message || "Could not update product. Please try again.";
    dispatch(setProductError(msg));
    toast.error(msg);
  }
};

// Delete product
export const deleteProduct = (id) => async (dispatch) => {
  try {
    await axiosInstance.delete(`/products/${id}`);
    dispatch(removeProduct(id));
    invalidateProductCache(); // ✅ Clear cache
    toast.success("Product removed from listings.");
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not remove product. Please try again.");
  }
};