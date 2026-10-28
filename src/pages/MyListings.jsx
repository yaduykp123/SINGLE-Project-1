import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyListings, deleteProduct, clearAllExpiredProducts } from "../redux/thunks/productThunks";
import { setFormOpen, setEditingProduct } from "../redux/slices/productSlice";
import ProductForm from "../components/ProductForm";
import ProductImage from "../components/ProductImage";
import ConfirmModal from "../components/ConfirmModal";
import { Plus, Pencil, Trash2, Package, AlertTriangle, Clock, Leaf, Ban } from "lucide-react";

const MyListings = () => {
  const dispatch = useDispatch();
  const { myListings, loading, formOpen } = useSelector(
    (state) => state.product
  );

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: () => {},
  });

  useEffect(() => {
    dispatch(fetchMyListings());
  }, [dispatch]);

  const handleEdit = (product) => {
    dispatch(setEditingProduct(product));
  };

  const handleDelete = (id, name = "product") => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to permanently delete "${name}" from your listings?`,
      confirmText: "Delete",
      onConfirm: () => {
        dispatch(deleteProduct(id));
      },
    });
  };

  const handleRemoveAllExpired = () => {
    setConfirmModal({
      isOpen: true,
      title: "Remove All Expired Products",
      message: `Are you sure you want to permanently remove all ${expiredProducts.length} expired product(s)? This will discard them from your listings.`,
      confirmText: `Remove All (${expiredProducts.length})`,
      onConfirm: () => {
        dispatch(clearAllExpiredProducts());
      },
    });
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
        className={`group relative bg-white border border-gray-200/90 shadow-sm hover:shadow-md dark:bg-[#111827]/80 dark:border-gray-800/60 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${
          isExpired 
            ? "border-gray-200/40 dark:border-gray-800/40 opacity-50 grayscale" 
            : "hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-500/30"
        }`}
      >
        {/* Image Container */}
        <div className="relative w-full aspect-[4/3] bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800/60 p-4 flex items-center justify-center overflow-hidden">
          <ProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            className="w-full h-full object-contain drop-shadow-sm"
          />

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isExpired && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-600/80 border border-gray-500/30 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
                <AlertTriangle size={10} />
                EXPIRED
              </div>
            )}

            {!isExpired && discountPercent > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white dark:bg-rose-500/20 dark:border dark:border-rose-500/30 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                {discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Top Right Badge */}
          <div className="absolute top-3 right-3">
            {!isExpired && daysUntilExpiry <= 3 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                <Clock size={10} />
                {daysUntilExpiry}d left
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Title */}
          <h3 className={`font-bold text-lg leading-tight mb-2 ${isExpired ? "text-gray-400 dark:text-gray-500" : "text-gray-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300 transition-colors"}`}>
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2.5 mb-4">
            <span className={`text-2xl font-extrabold tracking-tight ${isExpired ? "text-gray-400 dark:text-gray-600" : "text-emerald-600 dark:text-emerald-400"}`}>
              ₹{product.discountPrice}
            </span>
            {!isExpired && (
              <span className="text-sm text-gray-400 dark:text-gray-600 line-through font-medium">
                ₹{product.marketPrice}
              </span>
            )}
            {!isExpired && discountPercent > 0 && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-none px-2 py-0.5 rounded-md">
                SAVE ₹{product.marketPrice - product.discountPrice}
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 dark:bg-[#0f1520] dark:border-gray-800/50 px-2.5 py-1.5 rounded-lg">
              <span className="font-medium text-gray-500 dark:text-gray-400">Stock:</span>
              <span className="font-bold text-gray-800 dark:text-gray-300">{product.stock}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 dark:bg-[#0f1520] dark:border-gray-800/50 px-2.5 py-1.5 rounded-lg">
              <span className="font-bold text-gray-800 dark:text-gray-300">{product.quantity}</span>
              <span className="font-medium text-gray-500 dark:text-gray-400">{product.unit}</span>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-5">
            <Clock size={12} className="text-emerald-600 dark:text-emerald-500/70" />
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
          <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800/50">
            {!isExpired && (
              <button
                onClick={() => handleEdit(product)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gray-100 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-gray-700 hover:text-emerald-700 dark:bg-[#1a2235] dark:hover:bg-emerald-500/15 dark:border-gray-800 dark:hover:border-emerald-500/30 rounded-xl transition-all duration-300 text-xs font-bold dark:text-gray-400 dark:hover:text-emerald-300 cursor-pointer"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product._id, product.name);
              }}
              className={`flex items-center justify-center gap-1.5 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/20 dark:hover:border-rose-500/40 rounded-xl transition-all duration-300 text-xs font-bold dark:text-rose-400 cursor-pointer ${
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
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-md shadow-sm">
              <img 
                src="/Images/fresh-produce-clock.png" 
                alt="Inventory" 
                className="w-4 h-4 object-contain shrink-0" 
              />
              <span>My Active Listings</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">My Listings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Manage your posted products and track expirations
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-7 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 hover:shadow-emerald-600/30 hover:-translate-y-0.5 cursor-pointer"
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
          <div className="bg-white border border-gray-200 shadow-sm dark:bg-[#111827]/60 dark:border-gray-800/60 backdrop-blur-2xl text-center py-24 rounded-3xl max-w-xl mx-auto">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Package size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">No listings yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Start selling your surplus food items and prevent waste
            </p>
            <button 
              onClick={handleAddNew} 
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-7 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 text-sm hover:-translate-y-0.5 cursor-pointer"
            >
              Post Your First Product
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {/* ====== ACTIVE PRODUCTS ====== */}
            {activeProducts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5 tracking-tight">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                    <span className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                    Expired Products
                    <span className="text-sm text-gray-500 font-normal">({expiredProducts.length})</span>
                  </h2>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleRemoveAllExpired}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title="Permanently remove all expired products from your listings"
                    >
                      <Trash2 size={13} />
                      <span>Remove All Expired ({expiredProducts.length})</span>
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-[#1a2235] dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800/50">
                      View Only
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200/80 rounded-2xl p-4 mb-6 flex items-center gap-3 backdrop-blur-md shadow-sm">
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm font-medium">
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default MyListings;