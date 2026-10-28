import { memo, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Tag,
  AlertTriangle,
  Clock,
  User,
  Store,
  Truck,
  ShoppingCart,
  Check,
  Eye,
  Sparkles,
  Heart,
} from "lucide-react";
import { getDeliveryTimeInfo } from "../utils/deliveryCalculator";
import { saveRecentlyViewedProduct } from "../utils/recentlyViewed";
import { addToCart } from "../redux/thunks/cartThunks";
import ProductDetailModal from "./ProductDetailModal";
import ProductImage from "./ProductImage";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";

// Wrap with memo to prevent unnecessary re-renders
const ProductCard = memo(({ product }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(
    Array.isArray(user?.wishlist)
      ? user.wishlist.some((w) => (typeof w === "string" ? w === product._id : w?._id === product._id))
      : false
  );

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save to wishlist");
      return;
    }
    const nextVal = !isWishlisted;
    setIsWishlisted(nextVal);
    try {
      const res = await axiosInstance.post(`/users/wishlist/${product._id}`);
      if (res.data?.success) {
        toast.success(res.data.isWishlisted ? "Added to wishlist" : "Removed from wishlist");
      }
    } catch (err) {
      setIsWishlisted(!nextVal);
      toast.error("Failed to update wishlist");
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock < 1 || isExpired) return;
    dispatch(addToCart(product._id, 1, product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const isOfferPrice = product.offerPrice !== undefined && product.offerPrice !== null;
  const displayPrice = isOfferPrice ? product.offerPrice : product.discountPrice;
  const displayBasePrice = isOfferPrice
    ? product.basePrice || product.discountPrice
    : product.marketPrice;

  const discountPercent =
    displayBasePrice > 0
      ? Math.round(((displayBasePrice - displayPrice) / displayBasePrice) * 100)
      : 0;

  const daysUntilExpiry = Math.ceil(
    (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const isExpired = daysUntilExpiry < 0;
  const isMyProduct =
    user &&
    (product.owner === user._id || (product.owner && product.owner._id === user._id));

  // 🚚 Delivery & Proximity
  const storeLat = product.location?.coordinates?.[1] || 0;
  const storeLon = product.location?.coordinates?.[0] || 0;
  const deliveryInfo = useMemo(
    () =>
      getDeliveryTimeInfo(
        user?.latitude || 0,
        user?.longitude || 0,
        storeLat,
        storeLon
      ),
    [user?.latitude, user?.longitude, storeLat, storeLon]
  );

  // 3-Tier Expiry Status Indicator
  let expiryColorBadge = {
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300",
    text: `${daysUntilExpiry}d left`,
    dot: "bg-emerald-500 dark:bg-emerald-400",
  };

  if (isExpired) {
    expiryColorBadge = {
      bg: "bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-700/60 dark:border-gray-600/30 dark:text-gray-300",
      text: "Expired",
      dot: "bg-gray-400",
    };
  } else if (daysUntilExpiry <= 3) {
    expiryColorBadge = {
      bg: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-300",
      text: `${daysUntilExpiry}d left!`,
      dot: "bg-rose-500",
    };
  } else if (daysUntilExpiry <= 7) {
    expiryColorBadge = {
      bg: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300",
      text: `${daysUntilExpiry}d left`,
      dot: "bg-amber-500 dark:bg-amber-400",
    };
  }

  const cardClass = isMyProduct
    ? "group relative bg-white border border-dashed border-emerald-500/50 dark:bg-[#0f1520] dark:border-emerald-500/40 rounded-2xl overflow-hidden shadow-sm transition-colors duration-200 h-full flex flex-col cursor-default opacity-90 hover:border-emerald-500"
    : isExpired
    ? "group relative bg-gray-50 border border-gray-200 dark:bg-[#0a0e17] dark:border-gray-800/40 rounded-2xl overflow-hidden transition-colors duration-200 h-full flex flex-col cursor-not-allowed opacity-50 grayscale"
    : "group relative bg-white border border-gray-200/90 hover:border-emerald-500/50 dark:bg-[#111827] dark:border-gray-800 dark:hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col";

  return (
    <>
      <div className={cardClass}>
        {/* Clickable Image Container */}
        <div
          onClick={() => {
            saveRecentlyViewedProduct(product);
            setShowModal(true);
          }}
          className="relative w-full aspect-[4/3] bg-gray-50/60 border-b border-gray-100 dark:border-gray-800/50 dark:bg-gray-900/40 p-3 flex items-center justify-center overflow-hidden cursor-pointer"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            className="w-full h-full object-contain filter drop-shadow-sm transition-opacity duration-200"
          />

          {/* Top Left Badges: Verified Discount & Active Offer */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discountPercent > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm border border-rose-500 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-300 dark:backdrop-blur-md">
                <Tag size={10} />
                {discountPercent}% OFF
              </span>
            )}
            {isOfferPrice && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white dark:bg-amber-500/20 border border-amber-500/40 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm dark:backdrop-blur-md">
                <Sparkles size={9} />
                OFFER
              </span>
            )}
          </div>

          {/* Top Right Status Badge & Wishlist Button */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {isExpired ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-200 border border-gray-300 text-gray-700 dark:bg-gray-600/80 dark:border-gray-500/40 dark:text-gray-200 text-[10px] font-bold uppercase rounded-lg shadow-sm">
                <AlertTriangle size={10} />
                Expired
              </span>
            ) : isMyProduct ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-600/30 dark:border-emerald-500/40 dark:text-emerald-300 text-[10px] font-bold rounded-lg shadow-sm">
                <Store size={10} />
                Your Listing
              </span>
            ) : (
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-bold rounded-lg shadow-sm backdrop-blur-md ${expiryColorBadge.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${expiryColorBadge.dot}`} />
                <Clock size={10} />
                {expiryColorBadge.text}
              </span>
            )}

            {!isMyProduct && !isExpired && (
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                  isWishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/25 dark:border-rose-500/40 dark:text-rose-400"
                    : "bg-white/95 border-gray-200 text-gray-400 hover:text-rose-500 hover:bg-white dark:bg-gray-900/70 dark:border-gray-700/60 dark:text-gray-400 dark:hover:text-rose-400 dark:hover:bg-gray-900"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={13} className={isWishlisted ? "fill-rose-500 text-rose-500 dark:fill-rose-400 dark:text-rose-400" : ""} />
              </button>
            )}
          </div>

          {/* Quick Details Hover Overlay Button */}
          {!isExpired && (
            <div className="absolute inset-0 bg-black/25 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-3.5 py-1.5 rounded-full bg-white text-gray-900 border border-gray-200 dark:bg-gray-900/90 dark:text-white dark:border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-xl">
                <Eye size={13} className="text-emerald-600 dark:text-emerald-400" />
                Quick View
              </span>
            </div>
          )}

          <div className="hidden dark:block absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#111827] to-transparent pointer-events-none" />
        </div>

        {/* Content Details */}
        <div className="p-5 flex flex-col flex-grow justify-between">
          <div>
            {/* Category & Brand */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400/80 uppercase tracking-widest block truncate">
                {product.category}
              </span>
              {product.brand && (
                <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700/60 truncate max-w-[110px]">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Product Name */}
            <h3
              onClick={() => {
                saveRecentlyViewedProduct(product);
                setShowModal(true);
              }}
              className="font-bold text-gray-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300 text-base leading-snug transition-colors line-clamp-2 cursor-pointer mb-1.5 font-['Outfit']"
            >
              {product.name}
            </h3>

            {/* Description */}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3.5 line-clamp-2 leading-relaxed">
              {product.description || "Fresh surplus produce rescued to reduce waste."}
            </p>
          </div>

          <div>
            {/* Price Row */}
            <div className="flex flex-wrap items-baseline gap-2 mb-3">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-['Outfit'] tracking-tight">
                ₹{displayPrice}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 line-through font-medium">
                  ₹{displayBasePrice}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20 px-2 py-0.5 rounded-md ml-auto">
                  SAVE ₹{displayBasePrice - displayPrice}
                </span>
              )}
            </div>

            {/* Distance & Delivery Pill */}
            {!isExpired && (
              <div className="mb-3 px-2.5 py-1.5 bg-emerald-50/80 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <Truck size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{deliveryInfo.formattedTime}</span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  ({deliveryInfo.distanceKm !== null ? `${deliveryInfo.distanceKm} km away` : "Distance unavailable"})
                </span>
              </div>
            )}

            {/* Meta tags: Quantity & Stock status */}
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4">
              <span className="bg-gray-100 dark:bg-[#0b0f17] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-[11px] font-medium text-gray-700 dark:text-gray-400">
                {product.quantity} {product.unit}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  product.stock <= 3 && product.stock > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : product.stock > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {product.stock <= 3 && product.stock > 0
                  ? `Only ${product.stock} left`
                  : product.stock > 0
                  ? "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            {/* Seller Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between mb-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                <Store size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate text-gray-700 dark:text-gray-300 font-medium">{product.ownerName}</span>
              </div>
              <span className="flex items-center gap-1 text-[11px]">
                <MapPin size={11} className="text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[90px]">{product.city || "Nearby"}</span>
              </span>
            </div>

            {/* Card Actions */}
            {!isMyProduct && !isExpired && product.stock > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    added
                      ? "bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm dark:bg-emerald-600/15 dark:hover:bg-emerald-600 dark:text-emerald-400 dark:hover:text-white dark:border dark:border-emerald-500/30 dark:hover:border-emerald-500"
                  }`}
                >
                  {added ? <Check size={14} /> : <ShoppingCart size={14} />}
                  <span>{added ? "Added!" : "Add to Cart"}</span>
                </button>

                <Link
                  to={`/checkout/${product._id}`}
                  onClick={() => saveRecentlyViewedProduct(product)}
                  className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 hover:text-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700/80 dark:hover:border-emerald-500/40 dark:text-gray-200 dark:hover:text-white transition-all text-center"
                >
                  Buy
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={product}
      />
    </>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;

