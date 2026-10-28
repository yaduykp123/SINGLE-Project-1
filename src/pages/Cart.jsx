import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
} from "../redux/thunks/cartThunks";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import ProductImage from "../components/ProductImage";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useSelector((state) => state.cart);
  const [activeItemId, setActiveItemId] = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleIncrease = (itemId) => {
    dispatch(increaseQuantity(itemId));
  };

  const handleDecrease = (itemId) => {
    dispatch(decreaseQuantity(itemId));
  };

  const handleRemove = async (itemId) => {
    if (activeItemId) return;
    setActiveItemId(itemId);
    try {
      await dispatch(removeFromCart(itemId));
    } finally {
      setActiveItemId(null);
    }
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0b0f19] flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const items = cart?.items || [];
  const hasExpiredItems = items.some((item) => {
    const product =
      typeof item.product === "object" && item.product !== null
        ? item.product
        : {};
    return product?.expiryDate && new Date(product.expiryDate) <= new Date();
  });

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShoppingCart size={14} />
              Collection
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              Your Cart
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {cart?.itemCount || 0} items collected
            </p>
          </div>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 text-center py-20 rounded-2xl shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl dark:shadow-xl max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Start adding products to your collection
            </p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hasExpiredItems && (
              <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm dark:text-red-300">
                <AlertTriangle size={22} className="text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm">
                  <strong className="text-red-900 dark:text-red-200">Attention:</strong> One or more items in your cart have passed their expiry date and cannot be purchased. Please remove expired items before proceeding to checkout.
                </p>
              </div>
            )}
            {items.map((item) => {
              const product =
                typeof item.product === "object" && item.product !== null
                  ? item.product
                  : {};
              const stableKey =
                product._id ||
                (typeof item.product === "string" ? item.product : item._id);
              const isExpired =
                product?.expiryDate &&
                new Date(product.expiryDate) <= new Date();
              const isItemBusy = activeItemId === item._id;

              return (
                <div
                  key={stableKey}
                  className={`bg-white border border-gray-200/90 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 dark:shadow-xl transition-all hover:border-emerald-500/30 ${
                    isItemBusy ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-950 overflow-hidden flex items-center justify-center">
                      <ProductImage
                        src={product?.image}
                        alt={product?.name}
                        category={product?.category}
                        className="w-full h-full object-contain p-1"
                        iconSize={20}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                        {product?.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={10} className="text-emerald-600 dark:text-emerald-500/70 shrink-0" />
                        <span className="truncate">{product?.ownerName} • {product?.city || "Nearby"}</span>
                      </p>
                      {isExpired && (
                        <span className="text-xs text-red-600 dark:text-red-400 mt-1 block font-medium">
                          Product expired
                        </span>
                      )}
                      <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                        <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{item.unitPrice}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                          ₹{product?.marketPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                      <button
                        onClick={() => handleDecrease(item._id)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrease(item._id)}
                        disabled={item.quantity >= (product?.stock || 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px] sm:min-w-[80px]">
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        ₹{item.totalPrice}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      disabled={isItemBusy}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      title="Remove item"
                    >
                      {isItemBusy ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Cart Summary */}
            <div className="bg-white border border-gray-200/90 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl p-6 rounded-2xl dark:shadow-xl mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Total Items</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {cart.itemCount}
                </span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{cart.totalAmount}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => dispatch(clearCart())}
                  className="w-full sm:flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-all border border-gray-200 dark:border-gray-700 cursor-pointer text-center"
                >
                  Clear Collection
                </button>
                <button
                  onClick={() => navigate("/checkout/cart")}
                  disabled={hasExpiredItems}
                  className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 border border-emerald-500 disabled:border-transparent font-bold tracking-wide cursor-pointer text-center"
                >
                  {hasExpiredItems ? "Remove Expired Items to Checkout" : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;