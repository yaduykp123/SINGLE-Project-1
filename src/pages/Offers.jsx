import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchOffers, createOfferThunk, deleteOfferThunk } from "../redux/slices/offerSlice";
import { Tag, Sparkles, Clock, MapPin, Store, Plus, Trash2, X, AlertCircle, ShoppingBag, Layers } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Grocery Items", "Fruits", "Vegetables", "Meat/Fish", "Dairy", "Other"];

const Offers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { offers, loading, error } = useSelector((state) => state.offers);

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountPercentage: 20,
    category: "All",
    expiresAt: "",
    city: user?.city || "",
  });

  useEffect(() => {
    dispatch(fetchOffers());
  }, [dispatch]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.expiresAt) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const res = await dispatch(createOfferThunk(formData));
    if (res.success) {
      toast.success("Offer posted successfully! Nearby buyers notified!");
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        discountPercentage: 20,
        category: "All",
        expiresAt: "",
        city: user?.city || "",
      });
    } else {
      toast.error(res.message || "Failed to create offer");
    }
  };

  const handleDeleteOffer = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this offer?")) {
      const ok = await dispatch(deleteOfferThunk(id));
      if (ok) toast.success("Offer deleted");
    }
  };

  // ✅ Interactive Offer Click: Filter Products Page by Category & Discount %
  const handleOfferClick = (offer) => {
    if (user?.accountType === "shop") return;

    const category = offer.category || "All";
    const minDiscount = offer.discountPercentage || 0;
    const shopId = typeof offer.shopOwner === "object" ? offer.shopOwner?._id : offer.shopOwner;
    const shopName = offer.shopOwner?.fullName || "";

    const params = new URLSearchParams();
    if (category && category !== "All") params.append("category", category);
    if (minDiscount) params.append("minDiscount", minDiscount.toString());
    if (shopId) params.append("shopId", shopId);
    if (shopName) params.append("shopName", shopName);

    const categoryText = category !== "All" ? `${category} products` : "products";
    toast.success(`Showing ${categoryText} with at least ${minDiscount}% OFF...`);
    navigate(`/products?${params.toString()}`);
  };

  const isShopOwner = user?.accountType === "shop";

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-widest mb-1">
              <Sparkles size={16} />
              <span>Exclusive Local Deals</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Active Store Offers
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Click any offer card to see all matching products filtered by category & discount!
            </p>
          </div>

          {isShopOwner && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>Post New Offer</span>
            </button>
          )}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && offers.length === 0 && (
          <div className="text-center py-20 bg-[#111827]/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-md">
            <Tag size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Offers Nearby</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Check back soon! Local stores post new deals and clearance sales frequently.
            </p>
          </div>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const isMine =
              user &&
              (offer.shopOwner?._id === user._id || offer.shopOwner === user._id);

            const daysLeft = Math.ceil(
              (new Date(offer.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={offer._id}
                onClick={() => handleOfferClick(offer)}
                className="group relative bg-[#111827]/80 border border-gray-800/80 hover:border-emerald-500/50 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/40 flex flex-col justify-between cursor-pointer"
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl">
                      <Tag size={12} />
                      <span>{offer.discountPercentage}% OFF</span>
                    </span>

                    {offer.category && offer.category !== "All" && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl">
                        <Layers size={12} />
                        <span>{offer.category}</span>
                      </span>
                    )}
                  </div>

                  {daysLeft >= 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                      <Clock size={12} />
                      <span>{daysLeft === 0 ? "Ends Today" : `${daysLeft}d left`}</span>
                    </div>
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

                {/* Offer Content */}
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                    {offer.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                    {offer.description}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Store size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold text-gray-300 truncate max-w-[120px]">
                      {offer.shopOwner?.fullName || "Local Store"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>View {offer.category !== "All" ? offer.category : ""} Products →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Post New Offer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-xl hover:bg-gray-800"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={24} className="text-emerald-400" />
              <span>Post New Offer</span>
            </h2>
            <p className="text-gray-400 text-xs mb-6">
              Create a discount offer. Nearby users will instantly receive push & email alerts!
            </p>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Offer Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. 30% OFF Dairy Super Sale"
                  required
                  className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Product Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Discount (%) *
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    min="1"
                    max="99"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    City / Location
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Kochi / Mumbai"
                    className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Description *
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe items included in this offer..."
                  required
                  className="w-full bg-[#0b0f17] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
                >
                  Broadcast Offer
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