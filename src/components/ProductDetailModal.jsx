import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../redux/thunks/cartThunks";
import ProductImage from "./ProductImage";
import axiosInstance from "../api/axiosInstance";
import { getDeliveryTimeInfo } from "../utils/deliveryCalculator";
import {
  X,
  Clock,
  MapPin,
  Truck,
  Tag,
  ShieldCheck,
  Check,
  ShoppingCart,
  Store,
  Plus,
  Minus,
  Layers,
  AlertTriangle,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product?._id) {
      setQuantity(1);
      setLoading(true);
      axiosInstance
        .get(`/products/${product._id}`)
        .then((res) => {
          setDetails(res.data);
          setLoading(false);
        })
        .catch(() => {
          setDetails(product);
          setLoading(false);
        });
    } else {
      setDetails(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const activeProduct = details || product;
  const storeLat = activeProduct.location?.coordinates?.[1] || 0;
  const storeLon = activeProduct.location?.coordinates?.[0] || 0;
  const deliveryInfo = getDeliveryTimeInfo(
    user?.latitude || 0,
    user?.longitude || 0,
    storeLat,
    storeLon
  );

  const isOfferPrice = activeProduct.offerPrice !== undefined && activeProduct.offerPrice !== null;
  const displayPrice = isOfferPrice ? activeProduct.offerPrice : activeProduct.discountPrice;
  const displayBasePrice = isOfferPrice
    ? activeProduct.basePrice || activeProduct.discountPrice
    : activeProduct.marketPrice;

  const discountPercent =
    displayBasePrice > 0
      ? Math.round(((displayBasePrice - displayPrice) / displayBasePrice) * 100)
      : 0;

  const daysUntilExpiry = Math.ceil(
    (new Date(activeProduct.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysUntilExpiry < 0;

  // 3-Tier Expiry Status Indicator
  let expiryColorClass = "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20";
  let expiryLabel = `${daysUntilExpiry} days left (Fresh)`;
  if (daysUntilExpiry <= 0) {
    expiryColorClass = "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20";
    expiryLabel = "Expired";
  } else if (daysUntilExpiry <= 3) {
    expiryColorClass = "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20";
    expiryLabel = `Urgent: ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "day" : "days"} left to rescue`;
  } else if (daysUntilExpiry <= 7) {
    expiryColorClass = "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
    expiryLabel = `Approaching expiry: ${daysUntilExpiry} days left`;
  }

  const handleAddToCart = () => {
    dispatch(addToCart(activeProduct._id, quantity, activeProduct));
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleBuyNow = () => {
    onClose();
    navigate(`/checkout/${activeProduct._id}`);
  };

  const availableStock = activeProduct.stock || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-gray-900 dark:text-gray-100"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/80 dark:bg-gray-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Verified Product Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: Product Image & Badges */}
            <div className="space-y-4">
              <div className="relative w-full aspect-square bg-[#f8faf9] dark:bg-[#0b0f17] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-center overflow-hidden">
                <ProductImage
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  category={activeProduct.category}
                  className="w-full h-full object-contain filter drop-shadow-sm transition-opacity duration-200"
                />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm dark:bg-rose-500/20 dark:border dark:border-rose-500/40 dark:text-rose-300 dark:backdrop-blur-md">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {activeProduct.activeOffers?.length > 0 && (
                    <span className="px-2.5 py-1 bg-amber-500 text-white dark:bg-amber-500/20 border border-amber-500/40 dark:text-amber-300 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm dark:backdrop-blur-md">
                      <Sparkles size={11} />
                      Verified Offer
                    </span>
                  )}
                </div>

                {/* Expiry Pill */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 backdrop-blur-md ${expiryColorClass}`}
                  >
                    <Clock size={12} />
                    <span>{expiryLabel}</span>
                  </span>
                </div>
              </div>

              {/* Delivery & Proximity Pill */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Truck size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Estimated Delivery: {deliveryInfo.formattedTime}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  ({deliveryInfo.distanceKm !== null ? `${deliveryInfo.distanceKm} km away` : "Distance unavailable"})
                </span>
              </div>
            </div>

            {/* Right: Info, Price, Stock & Actions */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    {activeProduct.category}
                  </span>
                  {activeProduct.brand && (
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                      Brand: {activeProduct.brand}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug font-['Outfit']">
                  {activeProduct.name}
                </h2>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  {activeProduct.description || "Fresh surplus food rescued from local verified merchants."}
                </p>

                {/* Pricing Box */}
                <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">Rescue Price</span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-['Outfit']">
                        ₹{displayPrice}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-sm text-gray-400 dark:text-gray-500 line-through">₹{displayBasePrice}</span>
                      )}
                    </div>
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30 px-3 py-1 rounded-xl">
                      Save ₹{displayBasePrice - displayPrice}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Stock Availability:</span>
                  {availableStock > 0 ? (
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        availableStock <= 3
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      }`}
                    >
                      {availableStock <= 3 ? `Only ${availableStock} left in stock!` : `In Stock (${availableStock} units)`}
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Storage Instructions */}
                {activeProduct.storageInstructions && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800/60 rounded-xl flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                    <Info size={16} className="text-emerald-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">Storage Advice:</span>
                      <span>{activeProduct.storageInstructions}</span>
                    </div>
                  </div>
                )}

                {/* Seller & Location */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Store size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{activeProduct.ownerName || "Local Verified Merchant"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{activeProduct.city || "Nearby Area"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Quantity */}
              {!isExpired && availableStock > 0 ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Select Quantity:</span>
                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center text-gray-800 dark:text-white transition-all cursor-pointer shadow-xs"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white px-2">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                        disabled={quantity >= availableStock}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center text-gray-800 dark:text-white transition-all cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddToCart}
                      className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        added
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                          : "bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/30"
                      }`}
                    >
                      {added ? <Check size={16} /> : <ShoppingCart size={16} />}
                      <span>{added ? "Added to Cart!" : "Add to Cart"}</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 border border-emerald-500 cursor-pointer"
                    >
                      <span>Buy Now</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-center">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>{isExpired ? "This product has expired and cannot be purchased." : "Currently Out of Stock"}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FEFO Batch Inventory Information */}
          {activeProduct.batches && activeProduct.batches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/80">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <Layers size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Active Inventory Batches (FEFO Traceability)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {activeProduct.batches.map((b) => (
                  <div
                    key={b._id || b.batchNumber}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Batch #{b.batchNumber}</span>
                      <span className="text-gray-600 dark:text-gray-300 font-sans font-semibold">{b.availableStock} units</span>
                    </div>
                    <div className="mt-1.5 text-gray-500 dark:text-gray-400 text-[11px] flex items-center justify-between">
                      <span>Expiry:</span>
                      <span className="text-gray-800 dark:text-white font-medium">
                        {new Date(b.expiryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
