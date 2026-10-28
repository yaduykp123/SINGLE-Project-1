import {
  calculateDistanceKm,
  getDeliveryTimeInfo,
  getOrderStatusProgress,
} from "../utils/deliveryCalculator";

describe("deliveryCalculator Utils", () => {
  describe("calculateDistanceKm", () => {
    it("returns null when any coordinate is missing, null, undefined, or 0", () => {
      expect(calculateDistanceKm(null, 77.209, 28.6139, 77.209)).toBeNull();
      expect(calculateDistanceKm(undefined, 77.209, 28.6139, 77.209)).toBeNull();
      expect(calculateDistanceKm(0, 0, 28.6139, 77.209)).toBeNull();
      expect(calculateDistanceKm(28.6139, 77.209, null, 77.209)).toBeNull();
      expect(calculateDistanceKm(28.6139, 77.209, 28.6139, undefined)).toBeNull();
      expect(calculateDistanceKm(28.6139, 77.209, 0, 0)).toBeNull();
      expect(calculateDistanceKm("", "", "", "")).toBeNull();
    });

    it("calculates realistic distance between valid coordinates", () => {
      // Connaught Place (28.6315, 77.2167) to India Gate (28.6129, 77.2295) in New Delhi: ~2.4 km
      const distance = calculateDistanceKm(28.6315, 77.2167, 28.6129, 77.2295);
      expect(typeof distance).toBe("number");
      expect(distance).toBeGreaterThan(1.5);
      expect(distance).toBeLessThan(3.5);
    });

    it("handles string representations of numbers gracefully", () => {
      const distance = calculateDistanceKm("28.6315", "77.2167", "28.6129", "77.2295");
      expect(typeof distance).toBe("number");
      expect(distance).toBeGreaterThan(1.5);
    });
  });

  describe("getDeliveryTimeInfo", () => {
    it("returns explicit unavailable state when coordinates are invalid or missing", () => {
      const info = getDeliveryTimeInfo(null, null, 28.6139, 77.209);
      expect(info).toEqual({
        distanceKm: null,
        isAvailable: false,
        distanceText: "Distance unavailable",
        estimatedMins: null,
        formattedTime: "Standard Delivery",
        badgeText: "🚚 Standard Delivery",
      });
    });

    it("returns Express Delivery details for nearby stores (<= 10 km)", () => {
      const info = getDeliveryTimeInfo(28.6315, 77.2167, 28.6129, 77.2295);
      expect(info.isAvailable).toBe(true);
      expect(info.distanceKm).toBeGreaterThan(0);
      expect(info.distanceText).toContain("km away");
      expect(info.estimatedMins).toBeGreaterThanOrEqual(15);
      expect(info.badgeText).toContain("⚡ Express Delivery");
    });

    it("returns Standard Delivery badge for distant stores (> 10 km)", () => {
      // Delhi (28.6139, 77.2090) to Gurgaon (28.4595, 77.0266): ~25 km
      const info = getDeliveryTimeInfo(28.6139, 77.209, 28.4595, 77.0266);
      expect(info.isAvailable).toBe(true);
      expect(info.distanceKm).toBeGreaterThan(10);
      expect(info.badgeText).toContain("🚚 Standard Delivery");
    });
  });

  describe("getOrderStatusProgress", () => {
    it("returns correct progress for pending status", () => {
      const result = getOrderStatusProgress("pending", 30);
      expect(result.progressPercent).toBe(25);
      expect(result.statusLabel).toBe("Order Received & Preparing");
      expect(result.etaText).toBe("Est. Arrival in ~30 mins");
    });

    it("returns correct progress for confirmed status", () => {
      const result = getOrderStatusProgress("confirmed", 30);
      expect(result.progressPercent).toBe(50);
      expect(result.statusLabel).toBe("Packed & Ready for Pickup");
      expect(result.etaText).toBe("Est. Arrival in ~20 mins");
    });

    it("returns correct progress for shipped status", () => {
      const result = getOrderStatusProgress("shipped", 30);
      expect(result.progressPercent).toBe(80);
      expect(result.statusLabel).toBe("Out for Delivery");
      expect(result.etaText).toBe("Arriving Soon (~5-10 mins)");
    });

    it("returns correct progress for delivered status", () => {
      const result = getOrderStatusProgress("delivered");
      expect(result.progressPercent).toBe(100);
      expect(result.statusLabel).toBe("Delivered");
    });

    it("returns correct progress for cancelled status", () => {
      const result = getOrderStatusProgress("cancelled");
      expect(result.progressPercent).toBe(0);
      expect(result.statusLabel).toBe("Order Cancelled");
    });

    it("handles null or non-numeric estimatedMins safely by falling back to default 25", () => {
      const result = getOrderStatusProgress("pending", null);
      expect(result.etaText).toBe("Est. Arrival in ~25 mins");
      expect(result.etaText).not.toContain("null");
    });
  });
});
