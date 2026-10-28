/**
 *  BEGINNER-FRIENDLY DELIVERY TIME & DISTANCE CALCULATOR
 * 
 * Calculates distance between user and store using the Haversine formula,
 * and estimates delivery time based on prep time + travel speed.
 */
/**
 * 1. Haversine Formula: Calculates straight-line distance (in km) between 2 coordinates.
 * @param {number} lat1 User Latitude
 * @param {number} lon1 User Longitude
 * @param {number} lat2 Store / Product Latitude
 * @param {number} lon2 Store / Product Longitude
 * @returns {number} Distance in kilometers (e.g., 2.5)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  // Convert String coordinates to Numbers safely
  const userLat = Number(lat1);
  const userLon = Number(lon1);
  const storeLat = Number(lat2);
  const storeLon = Number(lon2);

  // If coordinates are missing, zero, or invalid, do not invent distance
  if (!userLat || !userLon || !storeLat || !storeLon) {
    return null;
  }

  const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers

  // Convert degree angles to radians
  const dLat = ((storeLat - userLat) * Math.PI) / 180;
  const dLon = ((storeLon - userLon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((storeLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  // Round to 1 decimal place (e.g., 3.4 km)
  return Math.round(distance * 10) / 10;
};

/**
 * 2. Delivery Time Estimator: Calculates total delivery time in minutes.
 * - Base Store Prep Time: 15 minutes (packing & item check)
 * - Travel Speed: ~3 minutes per km (~20 km/h urban speed)
 * 
 * @param {number} userLat
 * @param {number} userLon
 * @param {number} storeLat
 * @param {number} storeLon
 * @returns {object} { distanceKm, isAvailable, distanceText, estimatedMins, formattedTime, badgeText }
 */
export const getDeliveryTimeInfo = (userLat, userLon, storeLat, storeLon) => {
  const distanceKm = calculateDistanceKm(userLat, userLon, storeLat, storeLon);

  if (distanceKm === null) {
    return {
      distanceKm: null,
      isAvailable: false,
      distanceText: "Distance unavailable",
      estimatedMins: null,
      formattedTime: "Standard Delivery",
      badgeText: "🚚 Standard Delivery",
    };
  }

  const BASE_PREP_MINS = 15; // 15 mins store packing
  const TRAVEL_MINS_PER_KM = 3; // 3 mins per kilometer

  const travelMins = Math.round(distanceKm * TRAVEL_MINS_PER_KM);
  const totalMins = BASE_PREP_MINS + travelMins;

  // Format delivery time range for UI display (e.g., "20-25 mins")
  const minRange = totalMins;
  const maxRange = totalMins + 5;
  const formattedTime = `${minRange} - ${maxRange} mins`;

  let badgeText = `⚡ Express Delivery (~${totalMins} mins)`;
  if (distanceKm > 10) {
    badgeText = `🚚 Standard Delivery (~${totalMins} mins)`;
  }

  return {
    distanceKm,
    isAvailable: true,
    distanceText: `${distanceKm} km away`,
    estimatedMins: totalMins,
    formattedTime,
    badgeText,
  };
};

/**
 * 3. Live Order Progress Calculator: Gives progress percentage (0-100%) & status description.
 * @param {string} status Order status: "pending", "confirmed", "shipped", "delivered", "cancelled"
 * @param {number} estimatedMins Total estimated delivery minutes
 * @returns {object} { progressPercent, statusLabel, etaText }
 */
export const getOrderStatusProgress = (status, estimatedMins = 25) => {
  const effectiveMins =
    estimatedMins !== null && !isNaN(Number(estimatedMins))
      ? Number(estimatedMins)
      : 25;

  switch (status) {
    case "pending":
      return {
        progressPercent: 25,
        statusLabel: "Order Received & Preparing",
        etaText: `Est. Arrival in ~${effectiveMins} mins`,
      };
    case "confirmed":
      return {
        progressPercent: 50,
        statusLabel: "Packed & Ready for Pickup",
        etaText: `Est. Arrival in ~${Math.max(10, effectiveMins - 10)} mins`,
      };
    case "shipped":
      return {
        progressPercent: 80,
        statusLabel: "Out for Delivery",
        etaText: "Arriving Soon (~5-10 mins)",
      };
    case "delivered":
      return {
        progressPercent: 100,
        statusLabel: "Delivered",
        etaText: "Delivered to your doorstep",
      };
    case "cancelled":
      return {
        progressPercent: 0,
        statusLabel: "Order Cancelled",
        etaText: "Cancelled",
      };
    default:
      return {
        progressPercent: 20,
        statusLabel: "Processing Order",
        etaText: `~${effectiveMins} mins`,
      };
  }
};
