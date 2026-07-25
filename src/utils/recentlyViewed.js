/*
 *  RECENTLY VIEWED PRODUCTS HELPER 
 * Saves products viewed or backed out from Checkout page into localStorage,
 * allowing customers to pick up right where they left off on the Landing Page.
 */

const STORAGE_KEY = "expireoff_recently_viewed";

/**
 * Saves a product to Recently Viewed in localStorage.
 * @param {object} product Product object to save
 */
export const saveRecentlyViewedProduct = (product) => {
  if (!product || !product._id) return;

  try {
    const existingList = getRecentlyViewedProducts();

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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.log("Failed to save recently viewed product:", error);
  }
};

/**
 * Retrieves the array of Recently Viewed products from localStorage.
 * @returns {Array} Array of product objects
 */
export const getRecentlyViewedProducts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log("Failed to load recently viewed products:", error);
    return [];
  }
};

/**
 * Clears Recently Viewed products list from localStorage.
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {}
};
