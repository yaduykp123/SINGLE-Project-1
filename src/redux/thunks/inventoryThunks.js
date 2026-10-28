import axiosInstance from "../../api/axiosInstance";
import {
  setInventoryLoading,
  setInventoryError,
  setInventorySummary,
  setBatches,
  addBatchToState,
  updateBatchInState,
  removeBatchFromState,
  clearExpiredBatchesFromState,
  setTransactions,
  setDiscountSuggestions,
  removeSuggestion,
} from "../slices/inventorySlice";
import toast from "react-hot-toast";

// Fetch inventory summary and dashboard stats
export const fetchInventorySummary = () => async (dispatch) => {
  dispatch(setInventoryLoading(true));
  try {
    const { data } = await axiosInstance.get("/inventory/summary");
    if (data?.success) {
      dispatch(setInventorySummary(data));
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to load inventory summary";
    dispatch(setInventoryError(msg));
  }
};

// Fetch filtered batches with pagination
export const fetchBatches = (filters = {}) => async (dispatch) => {
  dispatch(setInventoryLoading(true));
  try {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.productId) params.append("productId", filters.productId);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const { data } = await axiosInstance.get(`/inventory/batches?${params.toString()}`);
    if (data?.success) {
      dispatch(setBatches(data));
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to fetch batches";
    dispatch(setInventoryError(msg));
  }
};

// Add a new batch for a product
export const addBatch = (batchData) => async (dispatch) => {
  dispatch(setInventoryLoading(true));
  try {
    const { data } = await axiosInstance.post("/inventory/batches", batchData);
    if (data?.success) {
      dispatch(addBatchToState(data.batch));
      toast.success(data.message || "Batch created successfully!");
      return data.batch;
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to add batch";
    dispatch(setInventoryError(msg));
    toast.error(msg);
    throw error;
  }
};

// Manually adjust stock for a batch
export const adjustBatchStock = ({ batchId, newStock, reason }) => async (dispatch) => {
  dispatch(setInventoryLoading(true));
  try {
    const { data } = await axiosInstance.put(`/inventory/batches/${batchId}/adjust`, {
      newStock,
      reason,
    });
    if (data?.success) {
      dispatch(updateBatchInState(data.batch));
      toast.success("Batch stock adjusted successfully");
      return data.batch;
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to adjust stock";
    dispatch(setInventoryError(msg));
    toast.error(msg);
    throw error;
  }
};

// Fetch inventory audit transactions
export const fetchInventoryTransactions = (filters = {}) => async (dispatch) => {
  dispatch(setInventoryLoading(true));
  try {
    const params = new URLSearchParams();
    if (filters.productId) params.append("productId", filters.productId);
    if (filters.batchId) params.append("batchId", filters.batchId);
    if (filters.page) params.append("page", filters.page);

    const { data } = await axiosInstance.get(`/inventory/transactions?${params.toString()}`);
    if (data?.success) {
      dispatch(setTransactions(data));
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to fetch audit history";
    dispatch(setInventoryError(msg));
  }
};

// Fetch smart discount suggestions
export const fetchDiscountSuggestions = () => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get("/inventory/discount-suggestions");
    if (data?.success) {
      dispatch(setDiscountSuggestions(data.suggestions));
    }
  } catch (error) {
    console.error("Failed to fetch suggestions:", error.message);
  }
};

// Approve and apply a discount suggestion
export const approveDiscount = ({ batchId, discountPercent, sellingPrice }) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.post("/inventory/apply-discount", {
      batchId,
      discountPercent,
      sellingPrice,
    });
    if (data?.success) {
      dispatch(removeSuggestion(batchId));
      if (data.result?.batch) {
        dispatch(updateBatchInState(data.result.batch));
      }
      toast.success(data.message || "Discount applied successfully!");
      return data.result;
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to apply discount";
    toast.error(msg);
    throw error;
  }
};

// Trigger immediate expiry check
export const triggerExpiryCheck = () => async (dispatch) => {
  try {
    const { data } = await axiosInstance.post("/inventory/run-expiry-check");
    if (data?.success) {
      toast.success("Automated expiry check completed!");
      dispatch(fetchInventorySummary());
      dispatch(fetchBatches());
    }
  } catch (error) {
    toast.error("Failed to run expiry check");
  }
};

// Delete or discard an individual batch (Optimistic UI update)
export const deleteBatch = (batchId, filters = {}) => async (dispatch) => {
  // Optimistically remove from state immediately
  dispatch(removeBatchFromState(batchId));
  try {
    const { data } = await axiosInstance.delete(`/inventory/batches/${batchId}`);
    if (data?.success) {
      toast.success(data.message || "Batch removed successfully");
      dispatch(fetchInventorySummary());
      return data;
    }
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to remove batch";
    toast.error(msg);
    // If backend delete failed, refresh batches to restore
    dispatch(fetchBatches(filters));
    throw error;
  }
};

// Clear all expired batches in bulk (Optimistic UI update)
export const clearAllExpiredBatches = (filters = {}) => async (dispatch) => {
  // Optimistically remove all expired batches from state immediately
  dispatch(clearExpiredBatchesFromState());
  try {
    const { data } = await axiosInstance.delete("/inventory/batches/expired/clear");
    if (data?.success) {
      toast.success(data.message || "All expired batches removed successfully!");
      dispatch(fetchInventorySummary());
      dispatch(fetchBatches(filters));
      return data;
    }
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to clear expired batches";
    toast.error(msg);
    dispatch(fetchBatches(filters));
    throw error;
  }
};
