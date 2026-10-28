import axiosInstance from "../../api/axiosInstance";
import {
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
  setProductLoading,
  setProductError,
  setFormOpen,
  setEditingProduct,
} from "../slices/productSlice";
import toast from "react-hot-toast";

// Simple in-memory cache for listings & reminders
const cache = {
  myListings: { data: null, timestamp: 0 },
  reminders: { data: null, timestamp: 0 },
};
const CACHE_DURATION = 30 * 1000;

export const invalidateProductCache = () => {
  cache.myListings = { data: null, timestamp: 0 };
  cache.reminders = { data: null, timestamp: 0 };
};

// Fetch products with rich multi-filter, search, sort, and pagination support
export const fetchProducts = (arg1, arg2, arg3, arg4) => async (dispatch) => {
  let params = {};
  if (typeof arg1 === "object" && arg1 !== null) {
    params = { ...arg1 };
  } else {
    params = {
      longitude: arg1 || 0,
      latitude: arg2 || 0,
      ...(arg3 && arg3 !== "All" ? { category: arg3 } : {}),
      ...(arg4 || {}),
    };
  }

  // Remove empty or 'All' keys
  Object.keys(params).forEach((key) => {
    if (
      params[key] === undefined ||
      params[key] === null ||
      params[key] === "" ||
      params[key] === "All"
    ) {
      delete params[key];
    }
  });

  dispatch(setProductLoading(true));
  try {
    const { data } = await axiosInstance.get("/products", { params });
    dispatch(setProducts(data));
    return data;
  } catch (error) {
    dispatch(
      setProductError(
        error.response?.data?.message || "Unable to load products. Please refresh or try again."
      )
    );
  }
};

// Fetch Featured Deals (Active, verified discounts)
export const fetchFeaturedDeals = () => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get("/products/featured-deals");
    dispatch(setFeaturedDeals(data));
    return data;
  } catch (error) {
    // Non-blocking for homepage
    return [];
  }
};

// Fetch Nearby Products
export const fetchNearbyProducts = (longitude, latitude, maxDistance = 25000) => async (dispatch) => {
  try {
    const params = { longitude, latitude, maxDistance };
    const { data } = await axiosInstance.get("/products/nearby", { params });
    dispatch(setNearbyProducts(data));
    return data;
  } catch (error) {
    return [];
  }
};

// Fetch Distinct Brands
export const fetchBrands = () => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get("/products/brands");
    dispatch(setBrands(data));
    return data;
  } catch (error) {
    return [];
  }
};

// Fetch Recommendations
export const fetchRecommendations = (limit = 8) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get("/products/recommendations", { params: { limit } });
    dispatch(setRecommendations(data));
    return data;
  } catch (error) {
    return [];
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

// Clear all expired products in bulk
export const clearAllExpiredProducts = () => async (dispatch) => {
  // Optimistically remove all expired products from UI immediately
  dispatch(clearExpiredProductsFromState());
  invalidateProductCache();
  try {
    const { data } = await axiosInstance.delete("/products/expired/clear");
    toast.success(data.message || "All expired products removed successfully!");
    return data;
  } catch (error) {
    // If backend delete fails, refetch to restore
    dispatch(fetchMyListings());
    const msg = error.response?.data?.message || "Could not remove expired products. Please try again.";
    toast.error(msg);
    throw error;
  }
};