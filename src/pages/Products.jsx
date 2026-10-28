import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchProducts, fetchBrands } from "../redux/thunks/productThunks";
import ProductCard from "../components/ProductCard";
import LocationPicker from "../components/LocationPicker";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Tag,
  X,
  Store,
  Layers,
  Flame,
  ArrowUpDown,
  RotateCcw,
  Package,
  Clock,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  Check,
  Percent,
  Compass,
} from "lucide-react";

const MemoizedProductCard = memo(ProductCard);

const Products = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useSelector((state) => state.auth);
  const { products, categories, brands, total, page, totalPages, limit, loading } =
    useSelector((state) => state.product);

  // Read URL query parameters
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";
  const initialBrand = searchParams.get("brand") || "All";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialMinDiscount = searchParams.get("minDiscount") || "";
  const initialExpiryStatus = searchParams.get("expiryStatus") || "all";
  const initialSort = searchParams.get("sort") || "relevance";
  const initialInStock = searchParams.get("inStock") === "true";
  const initialDistance = searchParams.get("maxDistance") || "25000";
  const initialPage = parseInt(searchParams.get("page")) || 1;

  // Filter States
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [minDiscount, setMinDiscount] = useState(initialMinDiscount);
  const [expiryStatus, setExpiryStatus] = useState(initialExpiryStatus);
  const [sortBy, setSortBy] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [maxDistance, setMaxDistance] = useState(initialDistance);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // UI Drawer & Modal States
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Debounce search input
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Fetch available brands on mount
  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  // Sync state to URL and fetch products from server
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
    if (selectedBrand && selectedBrand !== "All") params.set("brand", selectedBrand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minDiscount) params.set("minDiscount", minDiscount);
    if (expiryStatus && expiryStatus !== "all") params.set("expiryStatus", expiryStatus);
    if (sortBy && sortBy !== "relevance") params.set("sort", sortBy);
    if (inStockOnly) params.set("inStock", "true");
    if (maxDistance && maxDistance !== "25000") params.set("maxDistance", maxDistance);
    if (currentPage > 1) params.set("page", String(currentPage));

    setSearchParams(params, { replace: true });

    const userLon = user?.location?.coordinates?.[0] || user?.longitude || 0;
    const userLat = user?.location?.coordinates?.[1] || user?.latitude || 0;

    dispatch(
      fetchProducts({
        search: debouncedSearch,
        category: selectedCategory,
        brand: selectedBrand,
        minPrice,
        maxPrice,
        minDiscount,
        expiryStatus,
        sort: sortBy,
        inStock: inStockOnly ? "true" : undefined,
        longitude: userLon,
        latitude: userLat,
        maxDistance: parseInt(maxDistance) || 25000,
        page: currentPage,
        limit: 24,
        format: "paginated",
      })
    );
  }, [
    dispatch,
    debouncedSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minDiscount,
    expiryStatus,
    sortBy,
    inStockOnly,
    maxDistance,
    currentPage,
    user?.longitude,
    user?.latitude,
    user?.location,
  ]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setMinPrice("");
    setMaxPrice("");
    setMinDiscount("");
    setExpiryStatus("all");
    setSortBy("relevance");
    setInStockOnly(false);
    setMaxDistance("25000");
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (selectedCategory && selectedCategory !== "All") count++;
    if (selectedBrand && selectedBrand !== "All") count++;
    if (minPrice || maxPrice) count++;
    if (minDiscount) count++;
    if (expiryStatus && expiryStatus !== "all") count++;
    if (inStockOnly) count++;
    if (sortBy !== "relevance") count++;
    return count;
  }, [
    debouncedSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minDiscount,
    expiryStatus,
    inStockOnly,
    sortBy,
  ]);

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "highest_discount", label: "Highest Discount" },
    { value: "nearest", label: "Nearest First" },
    { value: "expiry_asc", label: "Earliest Expiry First" },
    { value: "newest", label: "Newest Arrivals" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Marketplace Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/90 dark:border-gray-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass size={14} />
              <span>Smart Discovery Marketplace</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight font-['Outfit']">
              Discover Surplus Food
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
              <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>
                {user?.city ? `Showing listings near ${user.city}, ${user.state || ""}` : "All locations"}
              </span>
              <button
                onClick={() => setShowLocationModal(true)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold underline text-xs ml-1 cursor-pointer"
              >
                Change Location
              </button>
            </p>
          </div>

          {/* Search Bar & Mobile Filter Trigger */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, brands, bakeries..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 dark:bg-gray-900/80 dark:border-gray-800 dark:text-white dark:placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none backdrop-blur-xl transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative hidden sm:block">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 dark:bg-gray-900/80 dark:border-gray-800 dark:text-gray-200 outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden p-2.5 bg-white border border-gray-200 hover:border-emerald-500/40 rounded-xl text-gray-700 hover:text-gray-900 dark:bg-gray-900/80 dark:border-gray-800 dark:text-gray-300 dark:hover:text-white flex items-center gap-2 text-xs font-semibold relative cursor-pointer shadow-xs"
            >
              <SlidersHorizontal size={17} className="text-emerald-600 dark:text-emerald-400" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 🏷️ ACTIVE FILTER CHIPS ROW */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-200 dark:border-gray-800/80 text-xs shadow-xs">
            <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5 mr-1">
              <Filter size={13} className="text-emerald-600 dark:text-emerald-400" />
              Active Filters:
            </span>

            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 font-medium">
                Keyword: "{debouncedSearch}"
                <X size={13} onClick={handleClearSearch} className="cursor-pointer hover:text-emerald-950 dark:hover:text-white" />
              </span>
            )}

            {selectedCategory !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 font-medium">
                Category: {selectedCategory}
                <X
                  size={13}
                  onClick={() => {
                    setSelectedCategory("All");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-emerald-950 dark:hover:text-white"
                />
              </span>
            )}

            {selectedBrand !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 font-medium">
                Brand: {selectedBrand}
                <X
                  size={13}
                  onClick={() => {
                    setSelectedBrand("All");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-emerald-950 dark:hover:text-white"
                />
              </span>
            )}

            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 font-medium">
                Price: ₹{minPrice || "0"} - ₹{maxPrice || "Any"}
                <X
                  size={13}
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-emerald-950 dark:hover:text-white"
                />
              </span>
            )}

            {minDiscount && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300 font-medium">
                Discount: {minDiscount}%+
                <X
                  size={13}
                  onClick={() => {
                    setMinDiscount("");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-rose-950 dark:hover:text-white"
                />
              </span>
            )}

            {expiryStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300 font-medium">
                Expiry:{" "}
                {expiryStatus === "expiring_today"
                  ? "Today"
                  : expiryStatus === "within_3_days"
                  ? "Within 3 Days"
                  : "Within 7 Days"}
                <X
                  size={13}
                  onClick={() => {
                    setExpiryStatus("all");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-amber-950 dark:hover:text-white"
                />
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-300 font-medium">
                In Stock Only
                <X
                  size={13}
                  onClick={() => {
                    setInStockOnly(false);
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-teal-950 dark:hover:text-white"
                />
              </span>
            )}

            {sortBy !== "relevance" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300 font-medium">
                Sort: {sortOptions.find((s) => s.value === sortBy)?.label}
                <X
                  size={13}
                  onClick={() => {
                    setSortBy("relevance");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer hover:text-purple-950 dark:hover:text-white"
                />
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold ml-auto flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* MAIN MARKETPLACE LAYOUT: SIDEBAR + GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 🎛️ DESKTOP FILTERS SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-gray-200 shadow-sm dark:bg-gradient-to-b dark:from-[#101726] dark:to-[#0a0e17] dark:border-gray-800/80 rounded-3xl p-5 space-y-6 sticky top-20 dark:shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-emerald-600 dark:text-emerald-400" />
                Filter Products
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-[11px] text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 transition-colors font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2.5">
                Categories
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {brands && brands.length > 0 && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                  Brands
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      setSelectedBrand("All");
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      selectedBrand === "All"
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <span>All Brands</span>
                    {selectedBrand === "All" && <Check size={14} />}
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setSelectedBrand(b);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        selectedBrand === b
                          ? "bg-emerald-600 text-white font-bold shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <span className="truncate">{b}</span>
                      {selectedBrand === b && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                Price Range (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-1/2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-1/2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Discount Tier Filter */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                Discount Range
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "10%+ Off", val: "10" },
                  { label: "25%+ Off", val: "25" },
                  { label: "50%+ Off", val: "50" },
                  { label: "70%+ Off", val: "70" },
                ].map((tier) => (
                  <button
                    key={tier.val}
                    onClick={() => {
                      setMinDiscount(minDiscount === tier.val ? "" : tier.val);
                      setCurrentPage(1);
                    }}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                      minDiscount === tier.val
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/50 shadow-xs"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 dark:bg-gray-950/60 dark:border-gray-800 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry Urgency Filter */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                Expiry Urgency
              </label>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Safe Inventory" },
                  { id: "expiring_today", label: "Expiring Today (Urgent)" },
                  { id: "within_3_days", label: "Within 3 Days" },
                  { id: "within_week", label: "Within 7 Days" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setExpiryStatus(item.id);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      expiryStatus === item.id
                        ? "bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 font-bold shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    {expiryStatus === item.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Only Toggle */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">In Stock Only</span>
              <button
                type="button"
                onClick={() => {
                  setInStockOnly(!inStockOnly);
                  setCurrentPage(1);
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  inStockOnly ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    inStockOnly ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </aside>

          {/* 🛍️ PRODUCTS LISTING GRID & PAGINATION */}
          <main className="lg:col-span-9 space-y-6">
            {/* Results Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pb-2">
              <span>
                Showing <strong className="text-gray-900 dark:text-white">{products.length}</strong> {products.length === 1 ? "product" : "products"}
                {total > 0 && ` of ${total} available`}
              </span>

              {/* Mobile Sort Menu */}
              <div className="sm:hidden">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-200 rounded-lg text-xs text-gray-800 dark:bg-gray-900 dark:border-gray-800 dark:text-white p-1.5 outline-none shadow-xs"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Cards Grid or Loading */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-[430px] rounded-3xl bg-white border border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 animate-pulse p-4 flex flex-col justify-between shadow-xs"
                  >
                    <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800/80 rounded-2xl" />
                    <div className="space-y-3 mt-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-gray-200 dark:bg-gray-900/50 dark:border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Package size={30} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matching products found</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  We couldn't find any items matching your active search or filters. Try adjusting price bounds, discount range, or clearing active chips.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <MemoizedProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-8 pb-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 border border-gray-200 text-xs font-bold text-gray-700 hover:text-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-800 dark:text-gray-300 dark:hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                    )
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {prev && p - prev > 1 && (
                            <span className="text-gray-400 px-1 text-xs">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                              currentPage === p
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 dark:bg-gray-900/80 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white dark:border-gray-800"
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 border border-gray-200 text-xs font-bold text-gray-700 hover:text-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-800 dark:text-gray-300 dark:hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 📱 MOBILE SLIDE-OUT FILTER DRAWER */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn">
          <div className="w-full max-w-xs bg-white text-gray-900 dark:bg-[#0f172a] dark:text-white h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between border-l border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Filter Products
                </span>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Sort */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Categories */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                  Category
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                  Price (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-1/2 p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-1/2 p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Mobile Discount */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                  Minimum Discount
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["10", "25", "50", "70"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setMinDiscount(minDiscount === d ? "" : d)}
                      className={`p-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                        minDiscount === d
                          ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/50"
                          : "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {d}%+ Off
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearAllFilters}
                className="w-full py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};

export default Products;