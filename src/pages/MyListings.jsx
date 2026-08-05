import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyListings, deleteProduct } from "../redux/thunks/productThunks";
import { setFormOpen, setEditingProduct } from "../redux/slices/productSlice";
import ProductForm from "../components/ProductForm";
import { Plus, Pencil, Trash2, Package, AlertTriangle, Clock, Leaf, Ban } from "lucide-react";

const MyListings = () => {
  const dispatch = useDispatch();
  const { myListings, loading, formOpen } = useSelector(
    (state) => state.product
  );

  useEffect(() => {
    dispatch(fetchMyListings());
  }, [dispatch]);

  const handleEdit = (product) => {
    dispatch(setEditingProduct(product));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
    }
  };

  const handleAddNew = () => {
    dispatch(setFormOpen(true));
  };

  const now = new Date();

  const activeProducts = myListings.filter((product) => {
    const expiryDate = new Date(product.expiryDate);
    return expiryDate > now;
  });

  const expiredProducts = myListings.filter((product) => {
    const expiryDate = new Date(product.expiryDate);
    return expiryDate <= now;
  });

  const renderProductCard = (product, isExpired = false) => {
    const discountPercent = Math.round(
      ((product.marketPrice - product.discountPrice) / product.marketPrice) * 100
    );
    const daysUntilExpiry = Math.ceil(
      (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div 
        key={product._id} 
        className={`group relative bg-[#111827]/80 border backdrop-blur-md rounded-3xl overflow-hidden flex flex-col transition-all duration-500 ${
          isExpired 
            ? "border-gray-800/40 opacity-50 grayscale" 
            : "border-gray-800/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-500/30"
        }`}
      >
        {/* Image Container — Full Image, No Zoom */}
        <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#1a2235] to-[#0f1520] p-5 flex items-center justify-center overflow-hidden">
          <img
            src={product.image || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={product.name}
            className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
          />

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isExpired && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-600/80 border border-gray-500/30 text-gray-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
                <AlertTriangle size={10} />
                EXPIRED
              </div>
            )}

            {!isExpired && discountPercent > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
                {discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Top Right Badge */}
          <div className="absolute top-3 right-3">
            {!isExpired && daysUntilExpiry <= 3 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
                <Clock size={10} />
                {daysUntilExpiry}d left
              </div>
            )}
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#111827] to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Title */}
          <h3 className={`font-bold text-lg leading-tight mb-2 ${isExpired ? "text-gray-500" : "text-white group-hover:text-emerald-300 transition-colors"}`}>
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2.5 mb-4">
            <span className={`text-2xl font-extrabold tracking-tight ${isExpired ? "text-gray-600" : "text-emerald-400"}`}>
              ₹{product.discountPrice}
            </span>
            {!isExpired && (
              <span className="text-sm text-gray-600 line-through font-medium">
                ₹{product.marketPrice}
              </span>
            )}
            {!isExpired && discountPercent > 0 && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                SAVE ₹{product.marketPrice - product.discountPrice}
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1.5 bg-[#0f1520] px-2.5 py-1.5 rounded-lg border border-gray-800/50">
              <span className="font-medium text-gray-400">Stock:</span>
              <span className="font-bold text-gray-300">{product.stock}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0f1520] px-2.5 py-1.5 rounded-lg border border-gray-800/50">
              <span className="font-bold text-gray-300">{product.quantity}</span>
              <span className="font-medium text-gray-400">{product.unit}</span>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
            <Clock size={12} className="text-emerald-500/70" />
            <span className="font-medium">
              {isExpired 
                ? `Expired on ${new Date(product.expiryDate).toLocaleDateString()}` 
                : `Expires: ${new Date(product.expiryDate).toLocaleDateString()}`
              }
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-800/50">
            {!isExpired && (
              <button
                onClick={() => handleEdit(product)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#1a2235] hover:bg-emerald-500/15 border border-gray-800 hover:border-emerald-500/30 rounded-xl transition-all duration-300 text-xs font-bold text-gray-400 hover:text-emerald-300"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            <button
              onClick={() => handleDelete(product._id)}
              className={`flex items-center justify-center gap-1.5 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all duration-300 text-xs font-bold text-rose-400 ${
                isExpired ? "w-full" : "flex-1"
              }`}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
              <img 
                src="/Images/LOGO_ExpireOFF-generated.png" 
                alt="expireOFF Icon" 
                className="w-20 object-contain shrink-0" 
              />
              Inventory
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">My Listings</h1>
            <p className="text-sm text-gray-400 font-medium">
              Manage your posted products and track expirations
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-7 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 hover:shadow-emerald-600/30 hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>

        {formOpen && <ProductForm />}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-emerald-500/30 border-t-emerald-500"></div>
          </div>
        ) : myListings.length === 0 ? (
          <div className="bg-[#111827]/60 border border-gray-800/60 backdrop-blur-2xl text-center py-24 rounded-3xl shadow-2xl shadow-black/30 max-w-xl mx-auto">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
              <Package size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">No listings yet</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Start selling your surplus food items and prevent waste
            </p>
            <button 
              onClick={handleAddNew} 
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-7 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 text-sm hover:-translate-y-0.5"
            >
              Post Your First Product
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {/* ====== ACTIVE PRODUCTS ====== */}
            {activeProducts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2.5 tracking-tight">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
                  Active Products 
                  <span className="text-sm text-gray-500 font-normal">({activeProducts.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeProducts.map((product) => renderProductCard(product, false))}
                </div>
              </div>
            )}

            {/* ====== EXPIRED PRODUCTS ====== */}
            {expiredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2.5 tracking-tight">
                    <span className="w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
                    Expired Products
                    <span className="text-sm text-gray-500 font-normal">({expiredProducts.length})</span>
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1a2235] text-gray-400 px-3 py-1.5 rounded-full border border-gray-800/50">
                    View Only
                  </span>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 backdrop-blur-md shadow-lg">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-200/80 font-medium">
                    These products have expired and are no longer visible to buyers. You can only delete them.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {expiredProducts.map((product) => renderProductCard(product, true))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;