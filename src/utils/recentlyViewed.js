/*
 *  RECENTLY VIEWED PRODUCTS HELPER 
 * Saves products viewed or backed out from Checkout page into localStorage per user,
 * allowing customers to pick up right where they left off on the Landing Page after login.
 */

const BASE_STORAGE_KEY = "expireoff_recently_viewed";

/**
 * Gets the current logged in user's ID from localStorage if available.
 */
const getCurrentUserId = () => {
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const user = JSON.parse(saved);
    return user?._id || null;
  } catch (error) {
    return null;
  }
};

/**
 * Generates user-specific storage key.
 */
const getStorageKey = (userId) => {
  const id = userId || getCurrentUserId();
  return id ? `${BASE_STORAGE_KEY}_${id}` : null;
};

/**
 * Saves a product to Recently Viewed in localStorage for the logged in user.
 * @param {object} product Product object to save
 * @param {string} [userId] Optional user ID
 */
export const saveRecentlyViewedProduct = (product, userId) => {
  if (!product || !product._id) return;

  const storageKey = getStorageKey(userId);
  if (!storageKey) return; // Do not save if user is not logged in

  try {
    const existingList = getRecentlyViewedProducts(userId);

    // Remove duplicate entry if it already exists
    const filteredList = existingList.filter((item) => item._id !== product._id);

    // Add product to beginning of array (keep max 6 items)
    const updatedList = [
      {
        _id: product._id,
        name: product.name,
        image: product.image,
        category: product.category,
        marketPrice: product.marketPrice,
        discountPrice: product.discountPrice,
        unit: product.unit,
        quantity: product.quantity,
        ownerName: product.ownerName,
        city: product.city,
      },
      ...filteredList,
    ].slice(0, 6);

    localStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch {
    // ignore storage errors
  }
};

/**
 * Retrieves the array of Recently Viewed products from localStorage for a specific user.
 * @param {string} [userId] Optional user ID
 * @returns {Array} Array of product objects
 */
export const getRecentlyViewedProducts = (userId) => {
  const storageKey = getStorageKey(userId);
  if (!storageKey) return [];

  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Clears Recently Viewed products list from localStorage for a specific user.
 * @param {string} [userId] Optional user ID
 */
export const clearRecentlyViewed = (userId) => {
  const storageKey = getStorageKey(userId);
  if (!storageKey) return;

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {}
};
