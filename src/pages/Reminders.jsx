import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchReminders } from "../redux/thunks/productThunks";
import { Clock, AlertTriangle, Package, Leaf, Ban } from "lucide-react";

const Reminders = () => {
  const dispatch = useDispatch();
  const { reminders, loading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchReminders());
  }, [dispatch]);

  const getUrgencyStyles = (days) => {
    if (days <= 1) return {
      container: "bg-red-500/10 border-red-500/30 border-l-4 border-l-red-500",
      text: "text-red-400",
      badge: "bg-red-500/20 text-red-300 border border-red-500/30"
    };
    if (days <= 2) return {
      container: "bg-amber-500/10 border-amber-500/30 border-l-4 border-l-amber-500",
      text: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30"
    };
    return {
      container: "bg-yellow-500/10 border-yellow-500/30 border-l-4 border-l-yellow-500",
      text: "text-yellow-400",
      badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
    };
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1 px-3 py-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <img 
              src="/Images/LOGO_ExpireOFF-generated.png" 
              alt="expireOFF Icon" 
              className="w-20  object-contain shrink-0" 
            />
            Expiry Tracker
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Clock size={28} className="text-emerald-400" />
            Expiry Reminders
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Products expiring in the next 3 days requiring your immediate attention
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl text-center py-20 rounded-2xl shadow-xl max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
              <Package size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No expiring products</h3>
            <p className="text-gray-400 text-sm">Your inventory is safe and fresh for now!</p>
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
                  className={`bg-gray-900/60 border backdrop-blur-xl p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all ${urgency.container}`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={product.image || "https://via.placeholder.com/80?text=No+Image"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-base tracking-tight">{product.name}</h3>
                        {daysUntilExpiry <= 1 && (
                          <AlertTriangle size={16} className="text-red-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2 font-medium">
                        <strong className="text-gray-300">{product.quantity}</strong> {product.unit} remaining
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${urgency.badge}`}>
                          Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                        </span>
                        <span className="text-gray-400 font-medium">
                          {new Date(product.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-800/80">
                    <div className="text-lg font-bold text-emerald-400">
                      ₹{product.discountPrice}
                    </div>
                    <div className="text-xs text-gray-500 line-through">
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