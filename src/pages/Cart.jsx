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
} from "lucide-react";

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
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShoppingCart size={14} />
              Collection
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Your Cart
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {cart?.itemCount || 0} items collected
            </p>
          </div>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl text-center py-20 rounded-2xl shadow-xl max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Start adding products to your collection
            </p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className={`bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl transition-all hover:border-gray-700 ${
                    isItemBusy ? "opacity-75" : ""
                  }`}
                >
                  <img
                    src={
                      product?.image ||
                      "https://via.placeholder.com/80?text=No+Image"
                    }
                    alt={product?.name}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base tracking-tight">
                      {product?.name}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-emerald-500/70" />
                      {product?.ownerName} • {product?.city || "Nearby"}
                    </p>
                    {isExpired && (
                      <span className="text-xs text-red-400 mt-1 block font-medium">
                        Product expired
                      </span>
                    )}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-bold text-emerald-400">
                        ₹{item.unitPrice}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ₹{product?.marketPrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-950/40 border border-gray-800 rounded-xl p-1">
                    <button
                      onClick={() => handleDecrease(item._id)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrease(item._id)}
                      disabled={item.quantity >= (product?.stock || 1)}
                      className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="text-lg font-bold text-white">
                      ₹{item.totalPrice}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(item._id)}
                    disabled={isItemBusy}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                    title="Remove item"
                  >
                    {isItemBusy ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Cart Summary */}
            <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Total Items</span>
                <span className="text-white font-semibold">
                  {cart.itemCount}
                </span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold text-white">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  ₹{cart.totalAmount}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => dispatch(clearCart())}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition-all border border-gray-700"
                >
                  Clear Collection
                </button>
                <button
                  onClick={() => navigate("/checkout/cart")}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-500/30 font-bold tracking-wide cursor-pointer"
                >
                  Proceed to Checkout
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