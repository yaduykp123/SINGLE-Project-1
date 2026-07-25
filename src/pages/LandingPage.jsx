import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import LocationDetector from "../components/LocationDetector";
import { getRecentlyViewedProducts, clearRecentlyViewed } from "../utils/recentlyViewed";
import { Leaf, ShoppingBag, Store, Clock, ArrowRight, MapPin, LogIn, UserPlus, Ban, Eye, Tag, X, Sparkles } from "lucide-react";

const LandingPage = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load recently viewed products from localStorage on mount
  useEffect(() => {
    const items = getRecentlyViewedProducts();
    setRecentlyViewed(items);
  }, []);

  const handleClearHistory = () => {
    clearRecentlyViewed();
    setRecentlyViewed([]);
  };

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate("/register");
      return;
    }
    if (user?.isAdmin) {
      navigate("/admin");
    } else if (user?.accountType === "household") {
      navigate("/products");
    } else if (user?.accountType === "shop") {
      navigate("/dashboard");
    }
  };

  const features = [
    { icon: Leaf, title: "Prevent Food Waste", desc: "Sell surplus food before it expires and reduce waste in your community." },
    { icon: ShoppingBag, title: "Buy at Discount", desc: "Get quality food items at discounted prices from nearby sellers." },
    { icon: Store, title: "Easy Selling", desc: "Shops and households can easily list their surplus products." },
    { icon: Clock, title: "Expiry Reminders", desc: "Get notified before your listed products expire." },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 selection:bg-emerald-500 selection:text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#0b0f19] to-[#0b0f19] py-20 px-4 border-b border-gray-800/60">
        {/* Glow Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Subtle Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
            <svg width="0" height="0" className="absolute">
              <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d5d3d2ff" />
                <stop offset="33%" stopColor="#c06437ff" />
                <stop offset="66%" stopColor="#adec10ff" />
                <stop offset="100%" stopColor="#1be9b9ff" />
              </linearGradient>

              <linearGradient id="rainbow-gradients" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#50de34ff" />
                <stop offset="33%" stopColor="#48d52fff" />
                <stop offset="66%" stopColor="#5f864dff" />
                <stop offset="100%" stopColor="#11e69fff" />
              </linearGradient>
            </svg>
            <Ban size={20} strokeWidth={2.5} style={{ stroke: "url(#rainbow-gradient)" }}>
              <Leaf size={23} strokeWidth={1.3} style={{ stroke: "url(#rainbow-gradients)" }} />
            </Ban>
            Smart Community Food Sharing
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Save Food, <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Save Money</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            <span className="text-emerald-400 font-medium">expireOff</span> connects you with nearby sellers to buy surplus food at great discounts before it goes to waste.
          </p>

          {/* Location prompt */}
          {isAuthenticated && !user?.city && !user?.isAdmin && (
            <div className="inline-flex flex-col items-center gap-3 bg-gray-900/60 border border-gray-800 backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-2xl">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <MapPin size={18} />
                <span>Set your location to discover nearby deals</span>
              </div>
              <LocationDetector />
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 text-white font-medium py-3.5 px-8 rounded-xl border border-gray-700/60 transition-all duration-200 shadow-lg hover:shadow-emerald-500/10"
                >
                  <LogIn size={18} className="text-emerald-400" />
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20 border border-emerald-400/20"
                >
                  <UserPlus size={18} />
                  Sign Up Free
                </button>
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3.5 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20 border border-emerald-400/20 group"
              >
                {user?.accountType === "shop" ? "Go to Shop Dashboard" : "Go to Marketplace"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🛒 👀 RECENTLY VIEWED PRODUCTS (Household Buyers Only) */}
      {recentlyViewed.length > 0 && user?.accountType !== "shop" && !user?.isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-gray-800/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Eye size={16} />
                <span>Pick up where you left off</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Recently Viewed Items
              </h2>
            </div>

            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-400 transition-colors"
            >
              <X size={14} />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {recentlyViewed.map((item) => {
              const discountPercent = Math.round(
                ((item.marketPrice - item.discountPrice) / item.marketPrice) * 100
              );

              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/checkout/${item._id}`)}
                  className="group bg-[#111827]/80 border border-gray-800/80 hover:border-emerald-500/40 rounded-xl p-2.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between cursor-pointer"
                >
                  <div className="relative w-full h-24 bg-[#0b0f17] rounded-lg overflow-hidden mb-2 p-1.5 flex items-center justify-center border border-gray-800/50">
                    <img
                      src={item.image || "https://via.placeholder.com/150?text=No+Image"}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    {discountPercent > 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[9px] font-black uppercase rounded">
                        {discountPercent}%
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5 truncate">
                      {item.category}
                    </span>
                    <h4 className="font-semibold text-white text-xs truncate group-hover:text-emerald-300 transition-colors mb-1">
                      {item.name}
                    </h4>

                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-xs font-extrabold text-emerald-400">
                        ₹{item.discountPrice}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-[10px] text-gray-500 line-through">
                          ₹{item.marketPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/checkout/${item._id}`);
                    }}
                    className="w-full py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all text-center"
                  >
                    Buy Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
            Why Choose <span className="text-emerald-400">expireOFF</span> ?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Our platform makes it easy to reduce food waste while saving money on high-quality products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;