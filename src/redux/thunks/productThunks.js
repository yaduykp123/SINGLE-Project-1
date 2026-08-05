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


//  Simple in-memory cache to prevent duplicate fetches
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
  
  //  Return cached data if fresh
  if (cache.products.data && cache.products.key === cacheKey && (now - cache.products.timestamp) < CACHE_DURATION) {
    dispatch(setProducts(cache.products.data));
    return;
  }

  dispatch(setProductLoading(true));
  try {
    const params = { longitude, latitude };
    if (category !== "All") params.category = category;
    const { data } = await axiosInstance.get("/products", { params });
    
    //  Store in cache
    cache.products = { data, timestamp: now, key: cacheKey };
    dispatch(setProducts(data));
  } catch (error) {
    dispatch(setProductError(error.response?.data?.message || "Unable to load nearby products. Please refresh or try again."));
  }
};


// Fetch single product — WITH CACHE
export const fetchProductById = (id) => async (dispatch, getState) => {
  const { product: { currentProduct } } = getState();
  
  //  Return cached if same product
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

// Create product — optimistic UI update for instant 0ms rendering
export const createProduct = (formData, tempProduct) => async (dispatch) => {
  if (tempProduct) {
    dispatch(addProduct(tempProduct));
  }
  try {
    const { data } = await axiosInstance.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (tempProduct) {
      dispatch(updateProductInState({ ...data, oldId: tempProduct._id }));
    } else {
      dispatch(addProduct(data));
    }
    invalidateProductCache();
    toast.success("Product listed successfully!");
  } catch (error) {
    if (tempProduct) {
      dispatch(removeProduct(tempProduct._id));
    }
    const msg = error.response?.data?.message || "Could not post product. Please check details and try again.";
    dispatch(setProductError(msg));
    toast.error(msg);
  }
};

// Update product — optimistic UI update without global page loading spinner
export const updateProduct = (id, formData, tempProduct) => async (dispatch) => {
  if (tempProduct) {
    dispatch(updateProductInState(tempProduct));
  }
  try {
    const { data } = await axiosInstance.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(updateProductInState(data));
    dispatch(setEditingProduct(null));
    invalidateProductCache(); //  Clear cache
    toast.success("Product updated successfully!");
  } catch (error) {
    const msg = error.response?.data?.message || "Could not update product. Please try again.";
    dispatch(setProductError(msg));
    toast.error(msg);
  }
};

// Delete product (Optimistic UI update)
export const deleteProduct = (id) => async (dispatch) => {
  // Optimistically remove product from UI immediately (0ms delay)
  dispatch(removeProduct(id));
  invalidateProductCache();
  try {
    await axiosInstance.delete(`/products/${id}`);
    toast.success("Product removed from listings.");
  } catch (error) {
    // If backend delete fails, refetch to restore
    dispatch(fetchMyListings());
    toast.error(error.response?.data?.message || "Could not remove product. Please try again.");
  }
};