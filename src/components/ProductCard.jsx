import { memo, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MapPin, Tag, AlertTriangle, Clock, User, Store, Truck,  ShoppingCart, Check,} from "lucide-react";
import { getDeliveryTimeInfo } from "../utils/deliveryCalculator";
import { saveRecentlyViewedProduct } from "../utils/recentlyViewed";
import { addToCart } from "../redux/thunks/cartThunks";

// ✅ Wrap with memo to prevent re-renders when parent updates
const ProductCard = memo(({ product }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart(product._id, 1, product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const isOfferPrice =
    product.offerPrice !== undefined && product.offerPrice !== null;
  const displayPrice = isOfferPrice
    ? product.offerPrice
    : product.discountPrice;
  const displayBasePrice = isOfferPrice
    ? product.basePrice || product.discountPrice
    : product.marketPrice;
  const discountPercent =
    isOfferPrice && product.basePrice
      ? Math.round(
          ((product.basePrice - product.offerPrice) / product.basePrice) * 100,
        )
      : Math.round(
          ((product.marketPrice - product.discountPrice) /
            product.marketPrice) *
            100,
        );
  const daysUntilExpiry = Math.ceil(
    (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24),
  );

  const isExpired = daysUntilExpiry < 0;
  const isMyProduct =
    user &&
    (product.owner === user._id ||
      (product.owner && product.owner._id === user._id));

  // 🚚 Calculate estimated delivery time based on user & store locations
  const storeLat = product.location?.coordinates?.[1] || 0;
  const storeLon = product.location?.coordinates?.[0] || 0;
  const deliveryInfo = useMemo(
    () =>
      getDeliveryTimeInfo(
        user?.latitude || 0,
        user?.longitude || 0,
        storeLat,
        storeLon,
      ),
    [user?.latitude, user?.longitude, storeLat, storeLon]
  );

  // ✅ Pre-compute className to avoid inline object creation
  const cardClass = isMyProduct
    ? "group relative bg-[#0f1520]/90 border border-dashed border-emerald-500/40 rounded-3xl overflow-hidden backdrop-blur-md transition-all duration-500 h-full flex flex-col cursor-default opacity-80 hover:border-emerald-500/60"
    : isExpired
      ? "group relative bg-[#0a0e17]/80 border border-gray-800/40 rounded-3xl overflow-hidden backdrop-blur-md transition-all duration-500 h-full flex flex-col cursor-not-allowed opacity-50 grayscale"
      : "group relative bg-[#111827]/80 border border-gray-800/60 rounded-3xl overflow-hidden backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-500/30 h-full flex flex-col cursor-pointer";

  const productDetails = (
    <div className="flex flex-col flex-grow">
      {/* Image Container — Full Image, No Zoom */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#1a2235] to-[#0f1520] p-5 flex items-center justify-center overflow-hidden">
        <img
          src={
            product.image || "https://via.placeholder.com/300x200?text=No+Image"
          }
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discountPercent > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
              <Tag size={10} />
              {discountPercent}% OFF
            </div>
          )}

          {isOfferPrice && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
              <Tag size={10} />
              OFFER
            </div>
          )}
        </div>

        {/* Top Right Status Badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isExpired ? (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-600/80 border border-gray-500/30 text-gray-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
              <AlertTriangle size={10} />
              Expired
            </div>
          ) : isMyProduct ? (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
              <Store size={10} />
              Your Listing
            </div>
          ) : daysUntilExpiry <= 3 ? (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
              <Clock size={10} />
              {daysUntilExpiry}d left
            </div>
          ) : null}
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#111827] to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Category & Name */}
        <div className="mb-3">
          <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mb-1.5 block">
            {product.category}
          </span>
          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-emerald-300 transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2.5 mb-3">
          <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            ₹{displayPrice}
          </span>
          {discountPercent > 0 && (
            <span className="text-sm text-gray-600 line-through font-medium">
              ₹{displayBasePrice}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
              SAVE ₹{displayBasePrice - displayPrice}
            </span>
          )}
        </div>

        {/* 🚚 Delivery Time & Distance Indicator */}
        {!isExpired && (
          <div className="mb-4 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <Truck size={13} className="text-emerald-400" />
              <span>{deliveryInfo.formattedTime}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              ({deliveryInfo.distanceKm} km away)
            </span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1.5 bg-[#0f1520] px-2.5 py-1.5 rounded-lg border border-gray-800/50">
            <Tag size={11} className="text-emerald-500/70" />
            <span className="font-medium">
              {product.quantity} {product.unit}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0f1520] px-2.5 py-1.5 rounded-lg border border-gray-800/50">
            <MapPin size={11} className="text-emerald-500/70" />
            <span className="font-medium">{product.city || "Nearby"}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Footer: Owner & Type */}
        <div className="pt-4 border-t border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <User size={12} className="text-emerald-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium truncate max-w-[100px]">
              {product.ownerName}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1a2235] text-gray-400 px-3 py-1 rounded-full border border-gray-800/50">
            {product.ownerType}
          </span>
        </div>

        {/* Expired Warning */}
        {isExpired && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
            <p className="text-xs text-rose-400 font-semibold flex items-center justify-center gap-1.5">
              <AlertTriangle size={12} />
              This product has expired
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cardClass}>
      {isMyProduct || isExpired ? (
        productDetails
      ) : (
        <Link
          to={`/checkout/${product._id}`}
          onClick={() => saveRecentlyViewedProduct(product)}
          className="flex flex-col flex-grow"
        >
          {productDetails}
        </Link>
      )}

      {/* Add to Cart — OUTSIDE of Link */}
      {!isMyProduct && !isExpired && (
        <div className="p-5 pt-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              added
                ? "bg-emerald-500 text-white border border-emerald-400 shadow-md shadow-emerald-500/20 scale-[0.98]"
                : "bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500"
            }`}
          >
            {added ? <Check size={14} /> : <ShoppingCart size={14} />}
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
      )}
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
