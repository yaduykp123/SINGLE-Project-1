import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../redux/thunks/productThunks";
import { setSelectedCategory } from "../redux/slices/productSlice";
import ProductCard from "../components/ProductCard";
import { Search, SlidersHorizontal, MapPin, Leaf, Package, Ban, Tag, X, Store, Layers } from "lucide-react";

// ✅ Memoized ProductCard to prevent re-renders
const MemoizedProductCard = memo(ProductCard);

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read query parameters passed from Offer card clicks
  const minDiscountParam = searchParams.get("minDiscount");
  const categoryParam = searchParams.get("category");
  const shopIdParam = searchParams.get("shopId");
  const shopNameParam = searchParams.get("shopName");

  const { user } = useSelector((state) => state.auth);
  const { products, categories, selectedCategory, loading } = useSelector(
    (state) => state.product
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  //  Always fetch products
  useEffect(() => {
    dispatch(fetchProducts(user?.longitude || 0, user?.latitude || 0, selectedCategory));
  }, [dispatch, user?.longitude, user?.latitude, selectedCategory]);

  //  Comprehensive Category & Discount Filtering Logic
  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Filter by Product Category if passed in URL (e.g., Dairy, Grocery Items, Fruits, etc.)
    if (categoryParam && categoryParam !== "All") {
      result = result.filter((product) =>
        product.category?.toLowerCase() === categoryParam.toLowerCase()
      );
    }

    // 2. Filter by Minimum Discount Percentage (e.g. >= 30% OFF)
    if (minDiscountParam) {
      const targetMin = Number(minDiscountParam);
      result = result.filter((product) => {
        if (!product.marketPrice || product.marketPrice <= 0) return false;
        const discountPercent =
          product.discountPercent ??
          Math.round(((product.marketPrice - product.discountPrice) / product.marketPrice) * 100);
        return discountPercent >= targetMin;
      });
    }

    // 3. Filter by Shop / Merchant
    if (shopIdParam || shopNameParam) {
      result = result.filter((product) => {
        const prodOwnerId =
          typeof product.owner === "object" ? product.owner?._id?.toString() : product.owner?.toString();
        
        const matchesId = shopIdParam && prodOwnerId === shopIdParam.toString();
        const matchesName =
          shopNameParam &&
          product.ownerName?.toLowerCase().includes(shopNameParam.toLowerCase());

        return matchesId || matchesName;
      });
    }

    // 4. Search keyword filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(term)
      );
    }

    return result;
  }, [products, searchTerm, categoryParam, minDiscountParam, shopIdParam, shopNameParam]);

  // Clear offer filter
  const handleClearOfferFilter = () => {
    searchParams.delete("category");
    searchParams.delete("minDiscount");
    searchParams.delete("shopId");
    searchParams.delete("shopName");
    setSearchParams(searchParams);
  };

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategorySelect = useCallback((cat) => {
    dispatch(setSelectedCategory(cat));
  }, [dispatch]);

  const hasOfferFilter = categoryParam || minDiscountParam || shopIdParam || shopNameParam;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <img 
                src="/Images/LOGO_ExpireOFF-generated.png" 
                alt="expireOFF Icon" 
                className="w-20 object-contain shrink-0" 
              />
              Market Place
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Products Near You</h1>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
              <MapPin size={14} className="text-emerald-400" />
              {user?.city ? `${user.city}, ${user.state}` : "Local Area"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none backdrop-blur-xl transition-all shadow-inner"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 bg-gray-900/60 border rounded-xl transition-colors backdrop-blur-xl ${
                showFilters ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* 🏷️ ACTIVE OFFER FILTER BANNER */}
        {hasOfferFilter && (
          <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-gray-900 to-emerald-950/80 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Filtered by Offer:</span>
                  {categoryParam && categoryParam !== "All" && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Layers size={12} />
                      {categoryParam}
                    </span>
                  )}
                  {minDiscountParam && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black text-xs px-2.5 py-0.5 rounded-md uppercase">
                      {minDiscountParam}% OFF or More
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-2">
                  {shopNameParam && (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Store size={12} />
                      {shopNameParam}
                    </span>
                  )}
                  <span>({filteredProducts.length} matching products found)</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleClearOfferFilter}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white rounded-xl transition-all shrink-0"
            >
              <X size={14} />
              <span>Show All Products</span>
            </button>
          </div>
        )}

        {/* Category Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 bg-gray-950/40 p-4 rounded-2xl border border-gray-800/80 backdrop-blur-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-400/25"
                    : "bg-gray-900/60 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl text-center py-20 rounded-2xl shadow-xl max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
              <Package size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No products found for this offer</h3>
            <p className="text-gray-400 text-sm">
              {hasOfferFilter
                ? `No ${categoryParam && categoryParam !== "All" ? categoryParam : ""} products currently match ${minDiscountParam ? `${minDiscountParam}% OFF` : "this filter"}. Click below to view all available products.`
                : searchTerm
                ? "Try searching for a different term"
                : "No products available in your area yet"}
            </p>
            {hasOfferFilter && (
              <button
                onClick={handleClearOfferFilter}
                className="mt-4 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all"
              >
                Show All Available Products
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <MemoizedProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;