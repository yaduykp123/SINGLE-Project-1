import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import LocationDetector from "../components/LocationDetector";
import LocationPicker from "../components/LocationPicker";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import {
  fetchFeaturedDeals,
  fetchNearbyProducts,
  fetchRecommendations,
} from "../redux/thunks/productThunks";
import { getRecentlyViewedProducts, clearRecentlyViewed } from "../utils/recentlyViewed";
import {
  Leaf,
  ShoppingBag,
  Store,
  Clock,
  ArrowRight,
  MapPin,
  Eye,
  Tag,
  X,
  Sparkles,
  ShieldCheck,
  Flame,
  Truck,
  Percent,
  Compass,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingDown,
  Navigation,
  Apple,
  Carrot,
  Milk,
  UtensilsCrossed,
  Fish,
  Package,
} from "lucide-react";

const LandingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { featuredDeals, nearbyProducts, recommendations } = useSelector(
    (state) => state.product
  );

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [heroSearch, setHeroSearch] = useState("");
  const [heroCategory, setHeroCategory] = useState("All");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Load recently viewed products
  useEffect(() => {
    if (user && user?._id && user?.accountType !== "shop" && !user?.isAdmin) {
      const items = getRecentlyViewedProducts(user._id);
      setRecentlyViewed(items);
    } else {
      setRecentlyViewed([]);
    }
  }, [user]);

  // Load real marketplace discovery sections
  useEffect(() => {
    setDealsLoading(true);
    dispatch(fetchFeaturedDeals()).finally(() => setDealsLoading(false));
    dispatch(fetchRecommendations(8));

    const userLon = user?.location?.coordinates?.[0] || user?.longitude || 0;
    const userLat = user?.location?.coordinates?.[1] || user?.latitude || 0;
    dispatch(fetchNearbyProducts(userLon, userLat, 25000));
  }, [dispatch, user?.longitude, user?.latitude, user?.location]);

  const handleClearHistory = () => {
    if (user?._id) {
      clearRecentlyViewed(user._id);
      setRecentlyViewed([]);
    }
  };

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroSearch.trim()) params.set("search", heroSearch.trim());
    if (heroCategory && heroCategory !== "All") params.set("category", heroCategory);
    navigate(`/products?${params.toString()}`);
  };

  const categories = [
    {
      name: "Fruits",
      query: "Fruits",
      icon: Apple,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20",
      tag: "Up to 60% Off",
      countText: "Apples, Citrus & Berries",
    },
    {
      name: "Vegetables",
      query: "Vegetables",
      icon: Carrot,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20",
      tag: "Farm Crisp",
      countText: "Leafy Greens & Roots",
    },
    {
      name: "Dairy",
      query: "Dairy",
      icon: Milk,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20",
      tag: "Short Expiry",
      countText: "Milk, Paneer & Cheese",
    },
    {
      name: "Bakery",
      query: "Bakery",
      icon: UtensilsCrossed,
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20",
      tag: "Daily Fresh",
      countText: "Sourdough, Breads & Buns",
    },
    {
      name: "Meat & Fish",
      query: "Meat/Fish",
      icon: Fish,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20",
      tag: "Chilled Safe",
      countText: "Poultry, Fish & Cuts",
    },
    {
      name: "Pantry & Groceries",
      query: "Grocery Items",
      icon: Package,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20",
      tag: "Bulk Value",
      countText: "Grains, Cereals & Staples",
    },
  ];

  const features = [
    {
      icon: Leaf,
      title: "Zero Food Waste",
      desc: "Connect local food vendors directly to community buyers, preventing thousands of kilos of good food from landfills.",
      badge: "Eco-Friendly",
    },
    {
      icon: Percent,
      title: "Smart FEFO Discounts",
      desc: "Our automated First-Expired, First-Out engine drops prices as best-before dates approach, maximizing your savings.",
      badge: "Save Up to 70%",
    },
    {
      icon: ShieldCheck,
      title: "100% Quality Inspected",
      desc: "All products must pass strict verification. Expired food is blocked automatically to ensure absolute food safety.",
      badge: "Food Safe",
    },
    {
      icon: Truck,
      title: "Live Order & Delivery Tracking",
      desc: "Track real-time courier distance, preparation milestones, and instant pickup coordinates right on your phone.",
      badge: "15-45 Mins",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Sellers List Perishables",
      desc: "Local supermarkets, bakeries, and households list their surplus batches with expiry countdowns.",
      icon: Store,
    },
    {
      step: "02",
      title: "Dynamic Smart Pricing",
      desc: "Our FEFO pricing algorithm applies progressive discounts, making fresh meals extremely affordable.",
      icon: TrendingDown,
    },
    {
      step: "03",
      title: "Rescue & Enjoy Fresh",
      desc: "Buyers browse live deals nearby, pay securely through Razorpay, and collect or receive delivery.",
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 selection:bg-emerald-500 selection:text-white overflow-hidden transition-colors duration-200">
      {/* 🚀 1. HERO SECTION */}
      <section className="relative border-b border-gray-200/80 dark:border-gray-800/60 pt-8 pb-16 lg:pt-14 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline, Description & Search Bar */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Live Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-400 text-xs sm:text-sm font-semibold tracking-wide mb-6 backdrop-blur-md shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                <span className="text-emerald-900 dark:text-emerald-300 font-bold">Live Food Discovery & Rescue</span>
                <span className="text-gray-300 dark:text-gray-500">•</span>
                <span className="text-amber-700 dark:text-amber-300 font-extrabold">Save 30% to 70%</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.12] mb-5 font-['Outfit']">
                Rescue Fresh Food.{" "}
                <span className="block mt-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 dark:from-emerald-400 dark:via-teal-300 dark:to-green-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(52,211,153,0.25)]">
                  Cut Grocery Bills.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                <strong className="text-gray-900 dark:text-white font-semibold">expireOFF</strong> connects smart shoppers with local bakeries, supermarkets, and green grocers to purchase premium surplus food before it expires. Fresh quality, verified discounts, zero food waste.
              </p>

              {/* 🔍 Prominent Hero Search Bar with Category Selector */}
              <form
                onSubmit={handleHeroSearchSubmit}
                className="bg-white border border-gray-200 hover:border-emerald-500/50 focus-within:border-emerald-500 dark:bg-gray-900/90 dark:border-gray-700/80 dark:hover:border-emerald-500/40 dark:focus-within:border-emerald-500 rounded-2xl p-2 sm:p-2.5 shadow-xl dark:shadow-2xl backdrop-blur-xl mb-8 max-w-xl mx-auto lg:mx-0 transition-all flex flex-col sm:flex-row gap-2"
              >
                <div className="flex-1 flex items-center px-3 gap-2.5">
                  <Search size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search fresh apples, sourdough bread, milk..."
                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 dark:text-white dark:placeholder-gray-500 outline-none"
                  />
                  {heroSearch && (
                    <button
                      type="button"
                      onClick={() => setHeroSearch("")}
                      className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:border-l sm:border-gray-200 dark:sm:border-gray-800 sm:pl-3">
                  <select
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-950/80 dark:border-gray-800 dark:text-gray-300 rounded-xl px-2.5 py-2.5 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Meat/Fish">Meat & Fish</option>
                    <option value="Grocery Items">Pantry Staples</option>
                  </select>

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Search</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start items-center mb-8">
                <button
                  onClick={() => navigate("/products?sort=highest_discount")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-7 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 group text-sm sm:text-base cursor-pointer"
                >
                  <Flame size={18} className="text-amber-300" />
                  <span>Explore Top Deals</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#categories"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 hover:text-emerald-700 border border-gray-200 dark:bg-gray-900/80 dark:hover:bg-gray-800 dark:text-gray-200 dark:hover:text-white font-semibold py-3.5 px-6 rounded-2xl dark:border-gray-700/80 transition-all shadow-sm hover:border-emerald-500/40 text-sm sm:text-base cursor-pointer"
                >
                  <Compass size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Browse Categories</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-5 border-t border-gray-200 dark:border-gray-800/80 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% FEFO Safe</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <Clock size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Live Expiry Timers</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <Truck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Doorstep Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Fresh Food Clock Graphic & Verified Info Pills */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative z-10 w-full max-w-[360px] sm:max-w-[420px]">
                <img
                  src="/Images/fresh-produce-clock.png"
                  alt="expireOFF Fresh Food Clock"
                  className="w-full h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)]"
                />
              </div>

              {/* Verified Deal Pill 1 */}
              <div className="absolute -top-3 -right-2 sm:-right-4 z-20 bg-white border border-emerald-200 dark:bg-gray-900 dark:border-emerald-500/30 rounded-2xl p-3 sm:p-3.5 shadow-md max-w-[200px] hidden xs:block">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wide">
                    Live Verified Deal
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Farm Fresh Produce</p>
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">Up to 70% Off</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                    <Clock size={11} /> Fresh Daily
                  </span>
                </div>
              </div>

              {/* Floating Pill 2 */}
              <div className="absolute -bottom-4 -left-2 sm:-left-6 z-20 bg-white/95 border border-emerald-200 dark:bg-gray-900/90 dark:border-emerald-500/30 backdrop-blur-xl rounded-2xl p-3 sm:p-3.5 shadow-xl hidden xs:block">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Food Safety Guarantee</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Zero Expired Stock Sold</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Live Impact Stats Strip */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-16">
        <div className="bg-white border border-gray-200/90 shadow-lg dark:bg-gradient-to-r dark:from-gray-900/90 dark:via-[#0f172a]/95 dark:to-gray-900/90 dark:border-gray-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 dark:shadow-2xl grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center sm:text-left border-r border-gray-100 dark:border-gray-800/60 pr-4">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-['Outfit']">14,800+</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Meals & Groceries Rescued</p>
          </div>
          <div className="text-center sm:text-left border-r-0 lg:border-r border-gray-100 dark:border-gray-800/60 pr-0 lg:pr-4">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-['Outfit']">₹6,80,000+</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Saved by Shoppers</p>
          </div>
          <div className="text-center sm:text-left border-r border-gray-100 dark:border-gray-800/60 pr-4">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-['Outfit']">9.4 Tons</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">CO₂ Emissions Averted</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-['Outfit']">100%</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">FEFO Food Safety Guarantee</p>
          </div>
        </div>
      </section>

      {/* 🧭 2. CATEGORY NAVIGATION WITH RICH FOOD IMAGERY */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Compass size={14} />
              <span>Explore by Category</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight font-['Outfit']">
              Shop Fresh Food Surplus
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select a category to browse discounted perishables and daily arrivals
            </p>
          </div>

          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>View All Categories</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, idx) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.query)}`)}
                className="group bg-white border border-gray-200 hover:border-emerald-500/50 dark:bg-[#111827] dark:border-gray-800 dark:hover:border-emerald-500/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between min-h-[160px]"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.iconBg} flex items-center justify-center mb-2.5 transition-colors`}>
                  <IconComponent size={24} className={cat.iconColor} />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{cat.countText}</p>
                </div>

                <span className="mt-2.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/40">
                  {cat.tag}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🔥 3. FEATURED DEALS (Verified Active Discounts from DB) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Flame size={15} />
              <span>Verified Active Discounts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight font-['Outfit']">
              Featured Food Deals
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Approved discounts on items approaching their best-before dates. 100% food safe.
            </p>
          </div>

          <button
            onClick={() => navigate("/products?sort=highest_discount")}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>See All Deals</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {dealsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-white border border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredDeals && featuredDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDeals.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-gray-200 dark:bg-gray-900/40 dark:border-gray-800 text-center shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading fresh featured deals from local vendors...</p>
          </div>
        )}
      </section>

      {/* 📍 4. NEARBY PRODUCTS WITH DISTANCE AWARENESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/90 shadow-sm dark:bg-gradient-to-b dark:from-[#101726] dark:to-[#0a0e17] dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Navigation size={14} />
                <span>Hyper-Local Discovery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight font-['Outfit']">
                Surplus Food Near You
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {user?.city
                  ? `Showing products available within delivery radius of ${user.city}`
                  : "Discover delicious meals and perishables available around your location"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700/80 text-xs font-bold dark:text-gray-200 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{user?.city ? `Location: ${user.city}` : "Set Location"}</span>
              </button>

              <button
                onClick={() => navigate("/products?sort=nearest")}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Browse All Nearby</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {nearbyProducts && nearbyProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nearbyProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin size={36} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Set Your Location for Nearby Deals</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
                Enable browser location or pick your city to see accurate distance, delivery time, and local bakery offers.
              </p>
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Choose Location
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 🌟 5. RECENTLY ADDED & RECOMMENDED RESCUES */}
      {recommendations && recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Sparkles size={14} />
                <span>Smart Community Picks</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight font-['Outfit']">
                Recommended For You
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                High-priority food rescue items and freshly listed local groceries
              </p>
            </div>

            <button
              onClick={() => navigate("/products?sort=newest")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-bold transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>Explore New Arrivals</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 🛒 RECENTLY VIEWED PRODUCTS (Household Buyers Only) */}
      {recentlyViewed.length > 0 && user && user?.accountType !== "shop" && !user?.isAdmin && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-b border-gray-200 dark:border-gray-800/60 mb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Eye size={16} />
                <span>Pick up where you left off</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Recently Viewed Items</h2>
            </div>

            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {recentlyViewed.map((item) => {
              const discountPercent = Math.round(
                ((item.marketPrice - item.discountPrice) / item.marketPrice) * 100
              );

              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/checkout/${item._id}`)}
                  className="group bg-white border border-gray-200 hover:border-emerald-500/40 dark:bg-[#111827] dark:border-gray-800 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-colors duration-200 flex flex-col justify-between cursor-pointer"
                >
                  <div className="relative w-full h-24 bg-gray-50 dark:bg-gray-900/40 rounded-lg overflow-hidden mb-2 p-1.5 flex items-center justify-center border border-gray-100 dark:border-gray-800/50">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      category={item.category}
                      className="w-full h-full object-contain filter drop-shadow-sm"
                    />
                    {discountPercent > 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-rose-600 text-white dark:bg-rose-500/20 dark:border dark:border-rose-500/30 dark:text-rose-300 text-[9px] font-black uppercase rounded shadow-xs">
                        {discountPercent}%
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-0.5 truncate">
                      {item.category}
                    </span>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-xs truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors mb-1">
                      {item.name}
                    </h4>

                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        ₹{item.discountPrice}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through">
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
                    className="w-full py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer"
                  >
                    Buy Now
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* How expireOff Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200 dark:border-gray-800/60">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>Effortless Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
            How expireOFF Works
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base font-normal">
            A frictionless cycle connecting food vendors and smart shoppers for maximum savings and zero food waste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="relative bg-white border border-gray-200 shadow-sm hover:shadow-xl dark:bg-gray-900/50 dark:border-gray-800/80 rounded-3xl p-8 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-emerald-600/30 dark:text-emerald-400/40 font-['Outfit']">
                      {st.step}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{st.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose expireOFF Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200 dark:border-gray-800/60">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Leaf size={14} />
            <span>Community Impact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
            Why Choose <span className="text-emerald-700 dark:text-emerald-400">expireOFF</span> ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Designed for households, grocers, and communities looking for a sustainable, cost-effective way to eat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-xl dark:bg-gray-900/50 dark:border-gray-800/80 rounded-2xl p-6 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-900 text-white dark:from-emerald-950/70 dark:via-gray-900 dark:to-emerald-950/70 border border-emerald-600/40 dark:border-emerald-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="text-xs uppercase font-bold text-emerald-300 dark:text-emerald-400 tracking-wider mb-2 block">
              Join Our Movement Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Stop Food Waste. Start Saving Money Today.
            </h2>
            <p className="text-emerald-100/90 dark:text-gray-300 text-sm sm:text-base mb-8 leading-relaxed">
              Whether you are a shopper looking for 30–70% discounts or a store looking to convert surplus stock into earnings, expireOFF is built for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/products")}
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-black/20 dark:shadow-emerald-600/30 border border-transparent dark:border-emerald-400/30 cursor-pointer"
              >
                <span>Browse Local Deals</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 bg-emerald-950/60 hover:bg-emerald-950 text-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-200 dark:hover:text-white font-semibold py-3.5 px-7 rounded-xl border border-emerald-700/60 dark:border-gray-700 transition-all cursor-pointer"
              >
                <Store size={18} className="text-emerald-400" />
                <span>Register Your Shop</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};

export default LandingPage;