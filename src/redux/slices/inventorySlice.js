import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  summary: {
    totalAvailableStock: 0,
    expiredStockTotal: 0,
    approachingExpiryCount: 0,
    lowStockCount: 0,
    pendingSuggestionsCount: 0,
    totalBatches: 0,
  },
  batches: [],
  transactions: [],
  suggestions: [],
  totalBatchesCount: 0,
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
  activeFilter: "all",
  batchModalOpen: false,
  adjustModalOpen: false,
  selectedBatch: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setInventoryLoading: (state, action) => {
      state.loading = action.payload;
    },
    setInventoryError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setInventorySummary: (state, action) => {
      state.summary = action.payload.summary || state.summary;
      if (action.payload.suggestions) {
        state.suggestions = action.payload.suggestions;
      }
      state.loading = false;
    },
    setBatches: (state, action) => {
      state.batches = action.payload.batches || [];
      state.totalBatchesCount = action.payload.total || 0;
      state.totalPages = action.payload.pages || 1;
      state.currentPage = action.payload.page || 1;
      state.loading = false;
    },
    addBatchToState: (state, action) => {
      state.batches.unshift(action.payload);
      state.summary.totalAvailableStock += action.payload.availableStock || 0;
      state.summary.totalBatches += 1;
      state.loading = false;
    },
    updateBatchInState: (state, action) => {
      const updated = action.payload;
      state.batches = state.batches.map((b) => (b._id === updated._id ? updated : b));
      state.loading = false;
    },
    removeBatchFromState: (state, action) => {
      const batchId = action.payload;
      state.batches = state.batches.filter((b) => b._id !== batchId);
      state.totalBatchesCount = Math.max(0, state.totalBatchesCount - 1);
      state.loading = false;
    },
    clearExpiredBatchesFromState: (state) => {
      const now = new Date();
      const initialCount = state.batches.length;
      state.batches = state.batches.filter((b) => {
        const isExp = new Date(b.expiryDate) <= now || (b.expiredStock || 0) > 0;
        return !isExp;
      });
      const removed = initialCount - state.batches.length;
      state.totalBatchesCount = Math.max(0, state.totalBatchesCount - removed);
      state.summary.expiredStockTotal = 0;
      state.loading = false;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload.transactions || [];
      state.loading = false;
    },
    setDiscountSuggestions: (state, action) => {
      state.suggestions = action.payload || [];
      state.summary.pendingSuggestionsCount = (action.payload || []).length;
      state.loading = false;
    },
    removeSuggestion: (state, action) => {
      const batchId = action.payload;
      state.suggestions = state.suggestions.filter((s) => s.batchId !== batchId);
      state.summary.pendingSuggestionsCount = Math.max(0, state.summary.pendingSuggestionsCount - 1);
    },
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
    },
    setBatchModalOpen: (state, action) => {
      state.batchModalOpen = action.payload;
    },
    setAdjustModalOpen: (state, action) => {
      state.adjustModalOpen = action.payload;
    },
    setSelectedBatch: (state, action) => {
      state.selectedBatch = action.payload;
    },
  },
});

export const {
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
  setActiveFilter,
  setBatchModalOpen,
  setAdjustModalOpen,
  setSelectedBatch,
} = inventorySlice.actions;

export default inventorySlice.reducer;
