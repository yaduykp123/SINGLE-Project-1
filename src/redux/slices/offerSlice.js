import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

const initialState = {
  offers: [],
  loading: false,
  error: null,
};

const offerSlice = createSlice({
  name: "offers",
  initialState,
  reducers: {
    setOffers: (state, action) => {
      state.offers = action.payload;
      state.loading = false;
    },
    addOfferInState: (state, action) => {
      state.offers.unshift(action.payload);
      state.loading = false;
    },
    removeOfferFromState: (state, action) => {
      state.offers = state.offers.filter((o) => o._id !== action.payload);
    },
    setOfferLoading: (state, action) => {
      state.loading = action.payload;
    },
    setOfferError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setOffers,
  addOfferInState,
  removeOfferFromState,
  setOfferLoading,
  setOfferError,
} = offerSlice.actions;

// Thunk: Fetch all active offers
export const fetchOffers = () => async (dispatch) => {
  try {
    dispatch(setOfferLoading(true));
    const res = await axiosInstance.get("/offers");
    if (res.data.success) {
      dispatch(setOffers(res.data.offers));
    }
  } catch (error) {
    dispatch(
      setOfferError(
        error.response?.data?.message || "Unable to load deals right now. Please try again."
      )
    );
  }
};

// Thunk: Create a new offer (Shop Owner)
export const createOfferThunk = (offerData) => async (dispatch) => {
  try {
    dispatch(setOfferLoading(true));
    const res = await axiosInstance.post("/offers/create", offerData);
    if (res.data.success) {
      dispatch(addOfferInState(res.data.offer));
      return { success: true, message: res.data.message };
    }
    return { success: false, message: "Could not create offer. Please check details and try again." };
  } catch (error) {
    const msg = error.response?.data?.message || "Could not create offer. Please try again.";
    dispatch(setOfferError(msg));
    return { success: false, message: msg };
  }
};

// Thunk: Delete an offer
export const deleteOfferThunk = (id) => async (dispatch) => {
  try {
    const res = await axiosInstance.delete(`/offers/${id}`);
    if (res.data.success) {
      dispatch(removeOfferFromState(id));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Delete offer failed:", error);
    return false;
  }
};

export default offerSlice.reducer;