import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchReminders } from "../redux/thunks/productThunks";
import ProductImage from "../components/ProductImage";
import { Clock, AlertTriangle, Package, Leaf, Ban } from "lucide-react";

const Reminders = () => {
  const dispatch = useDispatch();
  const { reminders, loading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchReminders());
  }, [dispatch]);

  const getUrgencyStyles = (days) => {
    if (days <= 1) return {
      container: "bg-red-50 border-red-200 border-l-4 border-l-red-500 dark:bg-red-500/10 dark:border-red-500/30 dark:border-l-red-500",
      text: "text-red-700 dark:text-red-400",
      badge: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30"
    };
    if (days <= 2) return {
      container: "bg-amber-50 border-amber-200 border-l-4 border-l-amber-500 dark:bg-amber-500/10 dark:border-amber-500/30 dark:border-l-amber-500",
      text: "text-amber-700 dark:text-amber-400",
      badge: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
    };
    return {
      container: "bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:border-l-yellow-500",
      text: "text-yellow-700 dark:text-yellow-400",
      badge: "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30"
    };
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md shadow-sm">
            <img 
              src="/Images/fresh-produce-clock.png" 
              alt="Expiry Tracker" 
              className="w-4 h-4 object-contain shrink-0" 
            />
            <span>Expiry & Freshness Monitor</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Clock size={28} className="text-emerald-600 dark:text-emerald-400" />
            Expiry Reminders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Products expiring in the next 3 days requiring your immediate attention
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl text-center py-20 rounded-2xl max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">No expiring products</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Your inventory is safe and fresh for now!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((product) => {
              const daysUntilExpiry = Math.ceil(
                (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
              );
              const urgency = getUrgencyStyles(daysUntilExpiry);

              return (
                <div
                  key={product._id}
                  className={`border backdrop-blur-xl p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all ${urgency.container}`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-xl border border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        category={product.category}
                        className="w-full h-full object-cover"
                        iconSize={20}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base tracking-tight">{product.name}</h3>
                        {daysUntilExpiry <= 1 && (
                          <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                        <strong className="text-gray-800 dark:text-gray-300">{product.quantity}</strong> {product.unit} remaining
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${urgency.badge}`}>
                          Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(product.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200 dark:border-gray-800/80">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{product.discountPrice}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                      ₹{product.marketPrice}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reminders;