import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchMyOrders,
  fetchReceivedOrders,
  updateOrderStatus,
  clearOrdersThunk,
  deleteOrderThunk,
} from "../redux/thunks/orderThunks";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Navigation,
  MapPin,
  Trash2,
  Layers,
  Eye,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Store,
  Tag,
  ShieldCheck,
  Calendar,
  X,
  ExternalLink,
  Info,
} from "lucide-react";
import { getDeliveryTimeInfo, getOrderStatusProgress } from "../utils/deliveryCalculator";
import ProductImage from "../components/ProductImage";
import toast from "react-hot-toast";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
    label: "Preparing Order",
  },
  confirmed: {
    icon: CheckCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
    label: "Order Confirmed",
  },
  shipped: {
    icon: Truck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400",
    label: "Out for Delivery",
  },
  delivered: {
    icon: Package,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
    label: "Delivered",
  },
  cancelled: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400",
    label: "Cancelled",
  },
};

// ==================== COMBO DETAILS MODAL ====================
const ComboDetailsModal = ({ order, isOpen, onClose, onCancel, isReceived }) => {
  const navigate = useNavigate();
  if (!isOpen || !order || !order.combo) return null;

  const { combo } = order;
  const items = combo.items || [];
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const originalTotal = (combo.originalPrice || 0) * (order.quantity || 1);
  const finalTotal = order.totalAmount || (combo.comboPrice || 0) * (order.quantity || 1);
  const totalSavings = Math.max(0, originalTotal - finalTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0e1422] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-gray-900 dark:text-gray-100 flex flex-col custom-scrollbar">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-5 sm:p-6 flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-lg shadow-purple-500/10">
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                  Combo Pack
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  {combo.discountPercentage}% Bundle Savings
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                {combo.name || order.productName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Cover & Overview Banner */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800/80 rounded-2xl items-center sm:items-start">
            <div className="w-24 h-24 rounded-xl border border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <ProductImage
                src={combo.image || order.productImage}
                alt={combo.name}
                category="Combo Pack"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2 mb-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{combo.name}</h3>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg}`}>
                  <StatusIcon size={13} className={status.color} />
                  <span className={status.color}>{status.label}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                {combo.description || "Curated value package bundled with savings."}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Items: <strong className="text-gray-900 dark:text-white">{items.length} Products</strong>
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Quantity: <strong className="text-gray-900 dark:text-white">{order.quantity} Pack(s)</strong>
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Ordered: <strong className="text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Immutable Product Items Included */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Package size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Products Included in this Package ({items.length})</span>
              </h4>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                Captured at purchase • Immutable snapshot
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3.5 bg-gray-50/70 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 rounded-2xl hover:border-gray-300 dark:hover:border-gray-700/80 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl border border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      category={item.category}
                      className="w-full h-full object-cover"
                      iconSize={18}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {item.name}
                      </h5>
                      {item.category && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Qty: <strong className="text-gray-800 dark:text-gray-200">{item.quantity || 1} {item.unit || "unit"}</strong>
                      </span>
                      {item.brand && (
                        <span>
                          Brand: <strong className="text-gray-800 dark:text-gray-200">{item.brand}</strong>
                        </span>
                      )}
                      {item.expiryDate && (
                        <span className="text-amber-600 dark:text-amber-400/90 text-[11px]">
                          Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{item.unitPrice || 0}
                    </span>
                    {item.marketPrice > (item.unitPrice || 0) && (
                      <span className="block text-[11px] text-gray-400 dark:text-gray-500 line-through">
                        ₹{item.marketPrice}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Order Financial Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800/80 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Price Breakdown</h4>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Original Package Value</span>
              <span className="text-gray-700 dark:text-gray-300 font-semibold line-through">₹{originalTotal}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Bundle Discount Savings ({combo.discountPercentage}%)</span>
                <span className="font-semibold">-₹{totalSavings}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Combo Price per Package</span>
              <span className="text-gray-900 dark:text-white font-semibold">₹{combo.comboPrice}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Ordered Quantity</span>
              <span className="text-gray-900 dark:text-white font-semibold">{order.quantity} Combo Pack(s)</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800/80 flex justify-between text-sm font-bold">
              <span className="text-gray-900 dark:text-white">Total Amount Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Seller & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-gray-50/70 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 rounded-xl">
              <span className="text-gray-500 dark:text-gray-400 block mb-1 font-semibold uppercase text-[10px]">
                {isReceived ? "Buyer Information" : "Seller Information"}
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-sm">
                {isReceived ? order.buyerName : order.sellerName}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                {isReceived ? order.buyerPhone : "Verified Merchant Store"}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50/70 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 rounded-xl">
              <span className="text-gray-500 dark:text-gray-400 block mb-1 font-semibold uppercase text-[10px]">
                Order & Payment Reference
              </span>
              <p className="font-mono text-gray-700 dark:text-gray-300 truncate">
                Order ID: {order.orderId || order._id}
              </p>
              <p className="font-mono text-gray-500 dark:text-gray-400 truncate text-[11px] mt-0.5">
                Payment: {order.paymentId}
              </p>
            </div>

            {order.shippingAddress && (
              <div className="sm:col-span-2 p-3.5 bg-gray-50/70 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 rounded-xl">
                <span className="text-gray-500 dark:text-gray-400 block mb-1 font-semibold uppercase text-[10px] flex items-center gap-1">
                  <MapPin size={11} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Delivery Destination</span>
                </span>
                <p className="text-gray-800 dark:text-gray-200">
                  {order.shippingAddress.name} ({order.shippingAddress.phone})
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 sm:p-5 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!isReceived && combo.comboId && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/checkout/combo?comboId=${combo.comboId}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reorder Combo</span>
              </button>
            )}

            {!isReceived && order.status !== "delivered" && order.status !== "cancelled" && (
              <button
                onClick={() => {
                  onClose();
                  onCancel(order._id);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <XCircle size={14} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== UNIFIED ORDER CARD COMPONENT ====================
const OrderCard = ({
  order,
  isReceived,
  user,
  handleStatusUpdate,
  handleCancelOrder,
  handleDeleteOrder,
  onOpenComboModal,
  isHighlighted = false,
}) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(isHighlighted);

  useEffect(() => {
    if (isHighlighted) {
      setIsExpanded(true);
      if (cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isHighlighted]);

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const isCombo = Boolean(order.isCombo && order.combo);
  const combo = order.combo;
  const items = combo?.items || [];

  // Calculate Delivery Distance & Time
  const storeLat =
    order.seller?.location?.coordinates?.[1] ??
    order.seller?.latitude ??
    order.product?.location?.coordinates?.[1] ??
    0;
  const storeLon =
    order.seller?.location?.coordinates?.[0] ??
    order.seller?.longitude ??
    order.product?.location?.coordinates?.[0] ??
    0;
  const userLat = user?.latitude || user?.location?.coordinates?.[1] || 0;
  const userLon = user?.longitude || user?.location?.coordinates?.[0] || 0;

  const deliveryInfo = getDeliveryTimeInfo(userLat, userLon, storeLat, storeLon);
  const trackingProgress = getOrderStatusProgress(order.status, deliveryInfo.estimatedMins);

  const displayImage = isCombo
    ? combo?.image || order.productImage || "/Images/fresh-produce-clock.png"
    : order.productImage || "/Images/fresh-produce-clock.png";

  const displayName = isCombo ? combo?.name || order.productName : order.productName;

  return (
    <div
      ref={cardRef}
      className={`border backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 ${
        isHighlighted ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20 " : ""
      }${
        isCombo
          ? "bg-purple-50/40 border-purple-200/80 hover:border-purple-300 dark:bg-[#0d1220]/90 dark:border-purple-500/30 dark:hover:border-purple-500/50 dark:shadow-purple-950/20"
          : "bg-white border-gray-200/80 hover:border-gray-300/80 dark:bg-gray-900/60 dark:border-gray-800/80"
      }`}
    >
      {/* Top Bar for Combo Pack Label */}
      {isCombo && (
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-purple-100 dark:border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 dark:from-purple-500/20 dark:to-indigo-500/20 dark:text-purple-300 dark:border-purple-500/30 shadow-sm">
              <Layers size={13} className="text-purple-600 dark:text-purple-400" />
              <span>Combo Pack • Bundle Offer</span>
            </span>
            <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 dark:text-purple-300 dark:bg-purple-500/10 dark:border-purple-500/20 px-2 py-0.5 rounded-lg font-semibold">
              {combo?.itemsCount || items.length} Products Included
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 dark:border-purple-500/30 dark:text-purple-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye size={13} />
            <span>{isExpanded ? "Hide Combo Details" : "View Combo Details"}</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}

      {/* Main Order Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="relative shrink-0">
          <div
            className={`w-20 h-20 rounded-xl border shrink-0 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${
              isCombo ? "border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/10" : "border-gray-200 dark:border-gray-800"
            }`}
          >
            <ProductImage
              src={displayImage}
              alt={displayName}
              category={isCombo ? "Combo" : "Order"}
              className="w-full h-full object-cover"
              iconSize={22}
            />
          </div>
          {isCombo && (
            <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-gray-900 shadow">
              {items.length}
            </span>
          )}
        </div>

        <div className="flex-1 w-full min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base tracking-tight truncate">
                {displayName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Order ID:{" "}
                <span className="text-gray-700 dark:text-gray-300 font-mono">
                  {order.orderId?.slice(-8) || order._id?.slice(-8)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg}`}>
                <StatusIcon size={14} className={status.color} />
                <span className={`text-xs font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>
              {order.status === "cancelled" && (
                <button
                  onClick={() => handleDeleteOrder(order._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Remove cancelled order"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Micro preview thumbnails for combo packages */}
          {isCombo && items.length > 0 && (
            <div className="flex items-center gap-2 my-2 py-1.5 px-3 bg-purple-50/60 border border-purple-200/60 dark:bg-purple-950/20 dark:border-purple-500/20 rounded-xl">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Includes:</span>
              <div className="flex items-center -space-x-2">
                {items.slice(0, 4).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image || "/Images/fresh-produce-clock.png"}
                    alt={item.name}
                    title={item.name}
                    className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-gray-900 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/Images/fresh-produce-clock.png";
                    }}
                  />
                ))}
                {items.length > 4 && (
                  <span className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-900 text-[10px] text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center">
                    +{items.length - 4}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 truncate ml-1 font-medium">
                {items.map((i) => i.name).slice(0, 2).join(", ")}
                {items.length > 2 ? "..." : ""}
              </span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-3 p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 dark:bg-gray-950/40 dark:border-gray-800/60 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Quantity</span>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {order.quantity} {isCombo ? "Combo Pack(s)" : "item(s)"}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Total Amount</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{order.totalAmount}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-0.5">
                {isReceived ? "Buyer" : "Seller"}
              </span>
              <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                {isReceived ? order.buyerName : order.sellerName}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Date</span>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* LIVE DELIVERY TRACKING BAR */}
          {order.status !== "cancelled" && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 dark:bg-[#080d16] dark:border-emerald-500/20 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Truck size={15} />
                  <span>{trackingProgress.statusLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Navigation size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {deliveryInfo.distanceKm !== null ? `${deliveryInfo.distanceKm} km away` : "Distance unavailable"}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
                  style={{ width: `${trackingProgress.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {trackingProgress.etaText}
                </span>
                <span>
                  {deliveryInfo.isAvailable ? `Est. Time: ~${deliveryInfo.estimatedMins} mins` : "Standard Delivery"}
                </span>
              </div>
            </div>
          )}

          {/* ==================== EXPANDED COMBO DETAILS (INLINE) ==================== */}
          {isCombo && isExpanded && (
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-500/20 space-y-4 animate-dropdown">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Package size={14} />
                  <span>Included Products ({items.length})</span>
                </h4>
                <button
                  onClick={() => onOpenComboModal(order)}
                  className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Screen View</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 bg-white border border-purple-100 rounded-xl dark:bg-gray-950/60 dark:border-gray-800/80"
                  >
                    <img
                      src={item.image || "/Images/fresh-produce-clock.png"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/Images/fresh-produce-clock.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>{item.quantity || 1} {item.unit || "unit"}</span>
                        {item.category && <span>• {item.category}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        ₹{item.unitPrice || 0}
                      </span>
                      {item.marketPrice > (item.unitPrice || 0) && (
                        <span className="block text-[10px] text-gray-400 dark:text-gray-500 line-through">
                          ₹{item.marketPrice}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Combo Financial Summary */}
              <div className="p-3 bg-gray-50/80 border border-gray-200/80 dark:bg-gray-950/40 dark:border-gray-800/60 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Regular Package Value</span>
                  <span className="line-through">₹{(combo.originalPrice || 0) * (order.quantity || 1)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Combo Discount Applied ({combo.discountPercentage}%)</span>
                  <span>-₹{Math.max(0, ((combo.originalPrice || 0) - (combo.comboPrice || 0)) * (order.quantity || 1))}</span>
                </div>
                <div className="pt-1 border-t border-gray-200 dark:border-gray-800 flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Seller Status Update Actions */}
          {isReceived && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/80">
              {order.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(order._id, "confirmed")}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 cursor-pointer"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="flex-1 py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/25 dark:text-red-400 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === "confirmed" && (
                <button
                  onClick={() => handleStatusUpdate(order._id, "shipped")}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 border border-blue-400/25 cursor-pointer"
                >
                  Mark as Shipped (Out for Delivery)
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => handleStatusUpdate(order._id, "delivered")}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 cursor-pointer"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          )}

          {/* Buyer Action Row: Reorder & Cancel */}
          {!isReceived && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {isCombo && combo?.comboId && (
                  <button
                    onClick={() => navigate(`/checkout/combo?comboId=${combo.comboId}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 dark:text-purple-300 dark:border-purple-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reorder Combo</span>
                  </button>
                )}
                {!isCombo && order.product && (
                  <button
                    onClick={() =>
                      navigate(
                        `/checkout/${typeof order.product === "object" ? order.product._id : order.product}`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <RotateCcw size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Buy Again</span>
                  </button>
                )}
              </div>

              {order.status !== "delivered" && order.status !== "cancelled" && (
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>Cancel Order</span>
                </button>
              )}
            </div>
          )}

          {/* Shipping Address Info */}
          {!isReceived && order.shippingAddress && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Delivering to: {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state} ({order.shippingAddress.pincode})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN ORDERS PAGE ====================
const Orders = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const targetOrderId = searchParams.get("orderId");
  const { user } = useSelector((state) => state.auth);
  const { myOrders, receivedOrders, loading } = useSelector((state) => state.order);

  const [activeTab, setActiveTab] = useState("all"); // "all" | "combos" | "products"
  const [selectedComboOrder, setSelectedComboOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchMyOrders(false, myOrders.length > 0));
    if (user?.accountType === "shop") {
      dispatch(fetchReceivedOrders(false, receivedOrders.length > 0));
    }
  }, [dispatch, user?._id, user?.accountType]);

  const handleStatusUpdate = (orderId, status) => {
    dispatch(updateOrderStatus(orderId, status));
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      dispatch(updateOrderStatus(orderId, "cancelled"));
    }
  };

  const handleClearCancelled = () => {
    if (window.confirm("Clear all cancelled orders from your history?")) {
      dispatch(clearOrdersThunk("cancelled"));
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm("Remove this cancelled order from history?")) {
      dispatch(deleteOrderThunk(orderId));
    }
  };

  // Filter orders based on active tab
  const filterOrders = (ordersList) => {
    if (activeTab === "combos") return ordersList.filter((o) => o.isCombo);
    if (activeTab === "products") return ordersList.filter((o) => !o.isCombo);
    return ordersList;
  };

  const filteredMyOrders = filterOrders(myOrders);
  const filteredReceivedOrders = filterOrders(receivedOrders);

  const comboOrdersCount = myOrders.filter((o) => o.isCombo).length;

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md shadow-sm">
              <img
                src="/Images/fresh-produce-clock.png"
                alt="Tracking"
                className="w-4 h-4 object-contain shrink-0"
              />
              <span>Live Order Tracking</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShoppingBag size={28} className="text-emerald-600 dark:text-emerald-400" />
              My Orders & Delivery Tracking
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track real-time distance, package contents, and manage combo order history
            </p>
          </div>

          {myOrders.some((o) => o.status === "cancelled") && (
            <button
              onClick={handleClearCancelled}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 dark:bg-gray-900/80 dark:hover:bg-red-500/10 dark:text-gray-300 dark:hover:text-red-400 dark:border-gray-800 dark:hover:border-red-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0"
              title="Clear all cancelled orders"
            >
              <Trash2 size={15} className="text-red-500 dark:text-red-400" />
              <span>Clear Cancelled Orders</span>
            </button>
          )}
        </div>

        {/* Filter Tabs: All Orders / Combo Packs / Individual Items */}
        <div className="flex items-center gap-2 mb-6 p-1.5 bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            All Orders ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("combos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "combos"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Layers size={13} />
            <span>Combo Packs ({comboOrdersCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Individual Products ({myOrders.length - comboOrdersCount})
          </button>
        </div>

        {loading && myOrders.length === 0 && (user?.accountType !== "shop" || receivedOrders.length === 0) ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Orders (as buyer) */}
            {filteredMyOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                  Orders Placed ({filteredMyOrders.length})
                </h2>
                <div className="space-y-4">
                  {filteredMyOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      isReceived={false}
                      user={user}
                      handleStatusUpdate={handleStatusUpdate}
                      handleCancelOrder={handleCancelOrder}
                      handleDeleteOrder={handleDeleteOrder}
                      onOpenComboModal={setSelectedComboOrder}
                      isHighlighted={Boolean(targetOrderId && (order._id?.toString() === targetOrderId || order.orderId === targetOrderId))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Received Orders (as seller) */}
            {user?.accountType === "shop" && filteredReceivedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></span>
                  Store Orders Received ({filteredReceivedOrders.length})
                </h2>
                <div className="space-y-4">
                  {filteredReceivedOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      isReceived={true}
                      user={user}
                      handleStatusUpdate={handleStatusUpdate}
                      handleCancelOrder={handleCancelOrder}
                      handleDeleteOrder={handleDeleteOrder}
                      onOpenComboModal={setSelectedComboOrder}
                      isHighlighted={Boolean(targetOrderId && (order._id?.toString() === targetOrderId || order.orderId === targetOrderId))}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredMyOrders.length === 0 && filteredReceivedOrders.length === 0 && (
              <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl text-center py-20 rounded-2xl max-w-xl mx-auto">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ShoppingBag size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {activeTab === "combos"
                    ? "No Combo Pack Orders"
                    : activeTab === "products"
                    ? "No Individual Product Orders"
                    : "No Orders Yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  {activeTab === "combos"
                    ? "Discover curated bundle deals on the Offers page to save more on combined packages."
                    : "Your order history and live delivery tracking will appear here."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Combo Details Modal */}
      <ComboDetailsModal
        order={selectedComboOrder}
        isOpen={Boolean(selectedComboOrder)}
        onClose={() => setSelectedComboOrder(null)}
        onCancel={handleCancelOrder}
        isReceived={Boolean(user?.accountType === "shop" && selectedComboOrder?.seller === user?._id)}
      />
    </div>
  );
};

export default Orders;