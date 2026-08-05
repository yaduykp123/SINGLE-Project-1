import axiosInstance from "../../api/axiosInstance";
import {
  setCart,
  setCartLoading,
  setCartError,
  clearCartState,
  optimisticAddToCart,
  optimisticRemoveFromCart,
  optimisticUpdateQuantity,
} from "../slices/cartSlice";
import toast from "react-hot-toast";

export const fetchCart = () => async (dispatch) => {
  dispatch(setCartLoading(true));
  try {
    const { data } = await axiosInstance.get("/cart");
    dispatch(setCart(data.cart));
  } catch (error) {
    dispatch(
      setCartError(error.response?.data?.message || "Failed to load cart")
    );
  }
};

export const addToCart = (productId, quantity = 1, productObj = null) => async (dispatch) => {
  // ⚡ 0ms Optimistic UI update: Reflect immediately on screen!
  dispatch(optimisticAddToCart({ product: productObj || { _id: productId }, quantity }));
  try {
    const { data } = await axiosInstance.post("/cart", {
      productId,
      quantity,
    });
    dispatch(setCart(data.cart));
    toast.success("Added to cart!");
  } catch (error) {
    dispatch(fetchCart()); // Revert if network call failed
    const msg = error.response?.data?.message || "Could not add to cart";
    dispatch(setCartError(msg));
    toast.error(msg);
  }
};

const updateQuantityTimers = {};
const quantityRequestSeq = {};

export const increaseQuantity = (itemId) => async (dispatch, getState) => {
  // ⚡ 0ms Optimistic UI update: Increment quantity instantly!
  dispatch(optimisticUpdateQuantity({ itemId, type: "increase" }));

  const items = getState().cart?.cart?.items || [];
  const currentItem = items.find(
    (i) => i._id === itemId || i.product?._id === itemId || i.product === itemId
  );
  const targetQuantity = currentItem?.quantity || 1;
  const targetItemId = currentItem?._id || itemId;

  // Track sequence number for this item
  const seq = (quantityRequestSeq[targetItemId] || 0) + 1;
  quantityRequestSeq[targetItemId] = seq;

  if (updateQuantityTimers[targetItemId]) {
    clearTimeout(updateQuantityTimers[targetItemId]);
  }

  updateQuantityTimers[targetItemId] = setTimeout(async () => {
    delete updateQuantityTimers[targetItemId];
    try {
      const { data } = await axiosInstance.put(`/cart/${targetItemId}`, {
        action: "set",
        quantity: targetQuantity,
      });

      // ONLY sync if no newer user clicks have occurred since this request started
      if (quantityRequestSeq[targetItemId] === seq) {
        dispatch(setCart(data.cart));
      }
    } catch (error) {
      if (quantityRequestSeq[targetItemId] === seq) {
        dispatch(fetchCart());
        toast.error(
          error.response?.data?.message || "Failed to update quantity"
        );
      }
    }
  }, 350);
};

export const decreaseQuantity = (itemId) => async (dispatch, getState) => {
  const itemsBefore = getState().cart?.cart?.items || [];
  const itemBefore = itemsBefore.find(
    (i) => i._id === itemId || i.product?._id === itemId || i.product === itemId
  );
  if (itemBefore && itemBefore.quantity <= 1) return;

  // ⚡ 0ms Optimistic UI update: Decrement quantity instantly!
  dispatch(optimisticUpdateQuantity({ itemId, type: "decrease" }));

  const itemsAfter = getState().cart?.cart?.items || [];
  const currentItem = itemsAfter.find(
    (i) => i._id === itemId || i.product?._id === itemId || i.product === itemId
  );
  const targetQuantity = currentItem?.quantity || 1;
  const targetItemId = currentItem?._id || itemId;

  // Track sequence number for this item
  const seq = (quantityRequestSeq[targetItemId] || 0) + 1;
  quantityRequestSeq[targetItemId] = seq;

  if (updateQuantityTimers[targetItemId]) {
    clearTimeout(updateQuantityTimers[targetItemId]);
  }

  updateQuantityTimers[targetItemId] = setTimeout(async () => {
    delete updateQuantityTimers[targetItemId];
    try {
      const { data } = await axiosInstance.put(`/cart/${targetItemId}`, {
        action: "set",
        quantity: targetQuantity,
      });

      // ONLY sync if no newer user clicks have occurred since this request started
      if (quantityRequestSeq[targetItemId] === seq) {
        dispatch(setCart(data.cart));
      }
    } catch (error) {
      if (quantityRequestSeq[targetItemId] === seq) {
        dispatch(fetchCart());
        toast.error(
          error.response?.data?.message || "Failed to update quantity"
        );
      }
    }
  }, 350);
};

export const removeFromCart = (itemId) => async (dispatch) => {
  // ⚡ 0ms Optimistic UI update: Remove from cart instantly!
  dispatch(optimisticRemoveFromCart(itemId));
  try {
    const { data } = await axiosInstance.delete(`/cart/${itemId}`);
    if (data?.cart) {
      dispatch(setCart(data.cart));
    }
    toast.success("Removed from cart");
  } catch (error) {
    dispatch(fetchCart());
    toast.error("Failed to remove item");
  }
};

export const clearCart = () => async (dispatch) => {
  try {
    await axiosInstance.delete("/cart");
    dispatch(clearCartState());
    toast.success("Cart cleared");
  } catch (error) {
    toast.error("Failed to clear cart");
  }
};