import { useEffect, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyOrders, fetchReceivedOrders, updateOrderStatus, clearOrdersThunk, deleteOrderThunk } from "../redux/thunks/orderThunks";
import { ShoppingBag, Package, Truck, CheckCircle, XCircle, Clock, Leaf, Ban, Navigation, MapPin, Trash2 } from "lucide-react";
import { getDeliveryTimeInfo, getOrderStatusProgress } from "../utils/deliveryCalculator";
import toast from "react-hot-toast";

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border border-amber-500/20", label: "Preparing Order" },
  confirmed: { icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10 border border-blue-500/20", label: "Order Confirmed" },
  shipped: { icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10 border border-purple-500/20", label: "Out for Delivery" },
  delivered: { icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border border-red-500/20", label: "Cancelled" },
};

const Orders = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myOrders, receivedOrders, loading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchMyOrders());
    if (user?.accountType === "shop") {
      dispatch(fetchReceivedOrders());
    }
  }, [dispatch, user]);

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

const OrderCard = ({ order, isReceived, user, handleStatusUpdate, handleCancelOrder, handleDeleteOrder }) => {
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

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

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-xl transition-all space-y-4">
      
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <img
          src={order.productImage || "https://via.placeholder.com/80?text=No+Image"}
          alt={order.productName}
          className="w-20 h-20 object-cover rounded-xl border border-gray-800 shrink-0"
        />
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-white text-base tracking-tight">{order.productName}</h3>
              <p className="text-xs text-gray-400">
                Order ID: <span className="text-gray-300 font-mono">{order.orderId?.slice(-8) || order._id?.slice(-8)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg}`}>
                <StatusIcon size={14} className={status.color} />
                <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
              </div>
              {order.status === "cancelled" && (
                <button
                  onClick={() => handleDeleteOrder(order._id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Remove cancelled order"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-3 p-3 bg-gray-950/40 rounded-xl border border-gray-800/60 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">Quantity</span>
              <p className="font-semibold text-gray-200">{order.quantity}</p>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Total Amount</span>
              <p className="font-bold text-emerald-400">₹{order.totalAmount}</p>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">{isReceived ? "Buyer" : "Seller"}</span>
              <p className="font-semibold text-gray-200 truncate">{isReceived ? order.buyerName : order.sellerName}</p>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Date</span>
              <p className="font-semibold text-gray-200">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/*  LIVE DELIVERY TIME TRACKING BAR */}
          {order.status !== "cancelled" && (
            <div className="p-4 bg-[#080d16] border border-emerald-500/20 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Truck size={15} />
                  <span>{trackingProgress.statusLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Navigation size={12} className="text-emerald-400" />
                  <span>{deliveryInfo.distanceKm} km away</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
                  style={{ width: `${trackingProgress.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                <span className="text-emerald-400 font-semibold">{trackingProgress.etaText}</span>
                <span>Est. Time: ~{deliveryInfo.estimatedMins} mins</span>
              </div>
            </div>
          )}

          {/* Seller Actions */}
          {isReceived && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800/80">
              {order.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(order._id, "confirmed")}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="flex-1 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {order.status === "confirmed" && (
                <button
                  onClick={() => handleStatusUpdate(order._id, "shipped")}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 border border-blue-400/25"
                >
                  Mark as Shipped (Out for Delivery)
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => handleStatusUpdate(order._id, "delivered")}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          )}

          {/*  Buyer Cancel Action */}
          {!isReceived && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 flex justify-end">
              <button
                onClick={() => handleCancelOrder(order._id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition-all"
              >
                <XCircle size={14} />
                <span>Cancel Order</span>
              </button>
            </div>
          )}

          {/* Shipping Address Info */}
          {!isReceived && order.shippingAddress && (
            <div className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
              <MapPin size={12} className="text-emerald-400 shrink-0" />
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <img 
                src="/Images/LOGO_ExpireOFF-generated.png" 
                alt="expireOFF Icon" 
                className="w-20 object-contain shrink-0" 
              />
              Transactions & Live Tracking
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShoppingBag size={28} className="text-emerald-400" />
              My Orders & Delivery Tracking
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Track real-time distance, delivery progress, and manage order history
            </p>
          </div>

          {myOrders.some((o) => o.status === "cancelled") && (
            <button
              onClick={handleClearCancelled}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/80 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-gray-800 hover:border-red-500/30 rounded-xl text-xs font-semibold transition-all shadow-lg cursor-pointer shrink-0"
              title="Clear all cancelled orders"
            >
              <Trash2 size={15} className="text-red-400" />
              <span>Clear Cancelled Orders</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Orders (as buyer) */}
            {myOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                  Orders Placed ({myOrders.length})
                </h2>
                <div className="space-y-4">
                  {myOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      isReceived={false}
                      user={user}
                      handleStatusUpdate={handleStatusUpdate}
                      handleCancelOrder={handleCancelOrder}
                      handleDeleteOrder={handleDeleteOrder}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Received Orders (as seller) */}
            {user?.accountType === "shop" && receivedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></span>
                  Orders Received ({receivedOrders.length})
                </h2>
                <div className="space-y-4">
                  {receivedOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      isReceived={true}
                      user={user}
                      handleStatusUpdate={handleStatusUpdate}
                      handleCancelOrder={handleCancelOrder}
                      handleDeleteOrder={handleDeleteOrder}
                    />
                  ))}
                </div>
              </div>
            )}

            {myOrders.length === 0 && receivedOrders.length === 0 && (
              <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl text-center py-20 rounded-2xl shadow-xl max-w-xl mx-auto">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                  <ShoppingBag size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No orders yet</h3>
                <p className="text-gray-400 text-sm">Your order history and live delivery tracking will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;