import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchOffers, createOfferThunk, deleteOfferThunk } from "../redux/slices/offerSlice";
import { fetchMyListings } from "../redux/thunks/productThunks";
import { Tag, Sparkles, Clock, Store, Plus, Trash2, X, AlertCircle, Package, Check, Navigation } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Grocery Items", "Fruits", "Vegetables", "Meat/Fish", "Dairy", "Other"];

const Offers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { offers, loading, error } = useSelector((state) => state.offers);
  const { myListings } = useSelector((state) => state.product);

  const [showModal, setShowModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountPercentage: 20,
    category: "All",
    expiresAt: "",
    city: user?.city || "",
    usageLimit: "",
    minOrderValue: "",
  });

  useEffect(() => {
    dispatch(fetchOffers(user?.latitude, user?.longitude));
    if (user?.accountType === "shop") {
      dispatch(fetchMyListings());
    }
  }, [dispatch, user?.latitude, user?.longitude, user?.accountType]);

  const [submitting, setSubmitting] = useState(false);

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const getPreviewPrice = (product) => {
    const base = product.discountPrice || product.marketPrice;
    return Math.max(1, Math.round(base * (1 - Number(formData.discountPercentage || 0) / 100)));
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.title.trim() || !formData.description.trim() || !formData.expiresAt) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product for this offer.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        productIds: selectedProductIds,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0,
      };

      const res = await dispatch(createOfferThunk(payload));
      if (res.success) {
        toast.success("Offer created & buyers notified!");
        setShowModal(false);
        setSelectedProductIds([]);
        setFormData({ title: "", description: "", discountPercentage: 20, category: "All", expiresAt: "", city: user?.city || "", usageLimit: "", minOrderValue: "" });
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Delete this offer?")) return;
    const ok = await dispatch(deleteOfferThunk(id));
    if (ok) toast.success("Offer deleted");
  };

  const isShopOwner = user?.accountType === "shop";

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-widest mb-1">
              <Sparkles size={16} />
              <span>Exclusive Local Deals</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Active Store Offers</h1>
            <p className="text-xs text-gray-400 mt-1">Only showing offers within delivery range of {user?.city || "your location"}</p>
          </div>

          {isShopOwner && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} />
              <span>Post New Offer</span>
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && offers.length === 0 && (
          <div className="text-center py-20 bg-[#111827]/60 border border-gray-800 rounded-3xl p-8">
            <Tag size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Offers Nearby</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Check back soon! Local stores post new deals frequently within your area.
            </p>
          </div>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers
            .filter((offer) => offer.expiresAt && new Date(offer.expiresAt) > new Date())
            .map((offer) => {
            const isMine = user && (offer.shopOwner?._id === user._id || offer.shopOwner === user._id);
            const daysLeft = Math.ceil((new Date(offer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={offer._id}
                className="group relative bg-[#111827]/80 border border-gray-800/80 hover:border-emerald-500/50 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl">
                      <Tag size={12} />
                      {offer.discountPercentage}% OFF
                    </span>
                    {offer.category !== "All" && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl">
                        {offer.category}
                      </span>
                    )}
                    {offer.distanceKm !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-gray-300 bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg">
                        <Navigation size={12} className="text-emerald-400" />
                        {offer.distanceKm} km
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft >= 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                        <Clock size={12} />
                        {daysLeft === 0 ? "Ends Today" : `${daysLeft}d left`}
                      </span>
                    )}
                    {(isMine || user?.isAdmin) && (
                      <button
                        onClick={(e) => handleDeleteOffer(offer._id, e)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete offer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                  {offer.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                  {offer.description}
                </p>

                {/* Linked Products with Offer Prices */}
                {offer.products?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                      Included Products
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {offer.products.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => navigate(`/checkout/${product._id}?offerId=${offer._id}`)}
                          className="flex-shrink-0 w-20 cursor-pointer group/prod text-center"
                        >
                          <div className="relative">
                            <img
                              src={product.image || "https://via.placeholder.com/64"}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-xl border border-gray-800 group-hover/prod:border-emerald-500/40 transition-all"
                            />
                            {product.offerPrice && (
                              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-gray-950 text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                ₹{product.offerPrice}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 truncate group-hover/prod:text-emerald-300">
                            {product.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Store size={14} className="text-emerald-400" />
                    <span className="font-semibold text-gray-300">
                      {offer.shopOwner?.fullName || "Local Store"}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold">
                    {offer.products?.length || 0} product{offer.products?.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Offer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-xl hover:bg-gray-800">
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={24} className="text-emerald-400" />
              Post New Offer
            </h2>
            <p className="text-gray-400 text-xs mb-6">
              Select products and set a discount. Nearby buyers will see exact final prices.
            </p>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Offer Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Weekend Dairy Sale"
                  className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Category Tag</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Discount % *</label>
                  <input type="number" min="1" max="99" required value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Usage Limit</label>
                  <input type="number" min="1" placeholder="Unlimited" value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Min Order (₹)</label>
                  <input type="number" min="0" placeholder="0" value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Valid Until *</label>
                <input type="date" required value={formData.expiresAt}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description *</label>
                <textarea rows="3" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the offer..."
                  className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
              </div>

              {/* Product Selector — Filtered by selected Category Tag */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Select Products *
                  </label>
                  {formData.category !== "All" && (
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                      Category: {formData.category}
                    </span>
                  )}
                </div>
                {myListings.length === 0 ? (
                  <p className="text-sm text-gray-500">You have no active listings to include.</p>
                ) : (
                  (() => {
                    const filteredListings = myListings.filter(
                      (p) =>
                        new Date(p.expiryDate) > new Date() &&
                        p.isActive &&
                        (formData.category === "All" || p.category === formData.category)
                    );

                    if (filteredListings.length === 0) {
                      return (
                        <div className="p-4 bg-[#0b0f17] border border-gray-800 rounded-xl text-center">
                          <p className="text-xs text-gray-400">
                            No active {formData.category !== "All" ? `"${formData.category}"` : ""} products found.
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Select another category or add products under "{formData.category}".
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-2 bg-[#0b0f17] border border-gray-800 rounded-xl">
                        {filteredListings.map((product) => {
                          const isSelected = selectedProductIds.includes(product._id);
                          return (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => toggleProductSelection(product._id)}
                              className={`relative p-2 rounded-xl border transition-all text-left ${
                                isSelected ? "border-emerald-500 bg-emerald-500/10" : "border-gray-800 hover:border-gray-700"
                              }`}
                            >
                              <img
                                src={product.image || "https://via.placeholder.com/64"}
                                alt={product.name}
                                className="w-full h-12 object-cover rounded-lg mb-1"
                              />
                              <p className="text-[10px] text-gray-300 truncate">{product.name}</p>
                              <p className="text-[9px] text-emerald-400 font-bold">₹{getPreviewPrice(product)}</p>
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
                <p className="text-[11px] text-gray-500 mt-1">{selectedProductIds.length} selected</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50">
                  {submitting ? "Broadcasting..." : "Broadcast Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;