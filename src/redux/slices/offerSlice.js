import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

const initialState = {
  offers: [],
  myOffers: [],
  currentOffer: null,
  loading: false,
  error: null,
};

const offerSlice = createSlice({
  name: "offers",
  initialState,
  reducers: {
    setOffers: (state, action) => {
      const now = new Date();
      const raw = (action.payload || []).filter(
        (o) => o.expiresAt && new Date(o.expiresAt) > now
      );
      const uniqueMap = new Map();
      raw.forEach((o) => { if (o._id) uniqueMap.set(o._id, o); });
      state.offers = Array.from(uniqueMap.values());
      state.loading = false;
      state.error = null;
    },
    setMyOffers: (state, action) => {
      const now = new Date();
      const raw = (action.payload || []).filter(
        (o) => o.expiresAt && new Date(o.expiresAt) > now
      );
      const uniqueMap = new Map();
      raw.forEach((o) => { if (o._id) uniqueMap.set(o._id, o); });
      state.myOffers = Array.from(uniqueMap.values());
      state.loading = false;
    },
    setCurrentOffer: (state, action) => {
      state.currentOffer = action.payload;
      state.loading = false;
    },
    addOffer: (state, action) => {
      const newOffer = action.payload;
      if (!newOffer || !newOffer._id) return;
      if (!state.offers.some((o) => o._id === newOffer._id)) {
        state.offers.unshift(newOffer);
      }
      if (!state.myOffers.some((o) => o._id === newOffer._id)) {
        state.myOffers.unshift(newOffer);
      }
      state.loading = false;
    },
    removeOffer: (state, action) => {
      const targetId = action.payload?.toString();
      state.offers = state.offers.filter((o) => o._id?.toString() !== targetId);
      state.myOffers = state.myOffers.filter((o) => o._id?.toString() !== targetId);
    },
    updateOfferInState: (state, action) => {
      const updated = action.payload;
      if (!updated?._id) return;
      const idStr = updated._id.toString();
      state.offers = state.offers.map((o) => (o._id?.toString() === idStr ? { ...o, ...updated } : o));
      state.myOffers = state.myOffers.map((o) => (o._id?.toString() === idStr ? { ...o, ...updated } : o));
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setOffers,
  setMyOffers,
  setCurrentOffer,
  addOffer,
  removeOffer,
  updateOfferInState,
  setLoading,
  setError,
  clearError,
} = offerSlice.actions;

// Thunks
export const fetchOffers = (lat, lng) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const params = {};
    if (lat !== undefined && lng !== undefined) {
      params.lat = lat;
      params.lng = lng;
    }
    const res = await axiosInstance.get("/offers", { params });
    dispatch(setOffers(res.data.offers || []));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to load offers"));
  }
};

export const fetchMyOffers = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await axiosInstance.get("/offers/my-offers");
    dispatch(setMyOffers(res.data.offers || []));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to load your offers"));
  }
};

export const fetchOfferById = (id) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await axiosInstance.get(`/offers/${id}`);
    dispatch(setCurrentOffer(res.data.offer));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Offer not found"));
  }
};

export const createOfferThunk = (offerData) => async (dispatch) => {
  try {
    const res = await axiosInstance.post("/offers/create", offerData);
    dispatch(addOffer(res.data.offer));
    return { success: true, message: res.data.message };
  } catch (error) {
    const msg = error.response?.data?.message || "Could not create offer";
    dispatch(setError(msg));
    return { success: false, message: msg };
  }
};

export const deleteOfferThunk = (id) => async (dispatch) => {
  // Optimistically remove offer from UI immediately (0ms delay)
  dispatch(removeOffer(id));
  try {
    await axiosInstance.delete(`/offers/${id}`);
    return true;
  } catch (error) {
    dispatch(fetchMyOffers());
    dispatch(setError(error.response?.data?.message || "Failed to delete offer"));
    return false;
  }
};

export default offerSlice.reducer;