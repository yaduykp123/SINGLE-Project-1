import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchInventorySummary,
  fetchBatches,
  addBatch,
  adjustBatchStock,
  fetchInventoryTransactions,
  fetchDiscountSuggestions,
  approveDiscount,
  triggerExpiryCheck,
  deleteBatch,
  clearAllExpiredBatches,
} from "../redux/thunks/inventoryThunks";
import {
  Package,
  Clock,
  AlertTriangle,
  TrendingDown,
  Plus,
  Tag,
  History,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
  Edit2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductImage from "./ProductImage";
import ConfirmModal from "./ConfirmModal";

const InventoryManagement = () => {
  const dispatch = useDispatch();
  const { summary, batches, transactions, suggestions, loading, totalBatchesCount, totalPages, currentPage } = useSelector(
    (state) => state.inventory
  );
  const { myListings } = useSelector((state) => state.product);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showDiscountsModal, setShowDiscountsModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: () => {},
  });

  // Form states for Add Batch
  const [batchFormData, setBatchFormData] = useState({
    productId: "",
    batchNumber: "",
    quantity: "",
    expiryDate: "",
    costPrice: "",
  });

  // Form states for Adjust Stock
  const [adjustFormData, setAdjustFormData] = useState({
    newStock: "",
    reason: "",
  });

  useEffect(() => {
    dispatch(fetchInventorySummary());
    dispatch(fetchBatches({ status: activeFilter, search: searchQuery }));
    dispatch(fetchDiscountSuggestions());
  }, [dispatch, activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchBatches({ status: activeFilter, search: searchQuery }));
  };

  const handleOpenAddBatch = (productId = "") => {
    const defaultProduct = productId || (myListings[0]?._id || "");
    setBatchFormData({
      productId: defaultProduct,
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      quantity: "10",
      expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      costPrice: "",
    });
    setShowAddBatchModal(true);
  };

  const handleSubmitAddBatch = async (e) => {
    e.preventDefault();
    if (!batchFormData.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!batchFormData.batchNumber.trim()) {
      toast.error("Please enter a batch number");
      return;
    }
    if (Number(batchFormData.quantity) <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!batchFormData.expiryDate) {
      toast.error("Please select an expiry date");
      return;
    }

    try {
      await dispatch(addBatch(batchFormData));
      setShowAddBatchModal(false);
      dispatch(fetchInventorySummary());
      dispatch(fetchBatches({ status: activeFilter, search: searchQuery }));
    } catch (err) {
      // Error handled by thunk
    }
  };

  const handleOpenAdjust = (batch) => {
    setSelectedBatch(batch);
    setAdjustFormData({
      newStock: batch.availableStock.toString(),
      reason: "Inventory audit count correction",
    });
    setShowAdjustModal(true);
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      await dispatch(
        adjustBatchStock({
          batchId: selectedBatch._id,
          newStock: Number(adjustFormData.newStock),
          reason: adjustFormData.reason,
        })
      );
      setShowAdjustModal(false);
      dispatch(fetchInventorySummary());
      dispatch(fetchBatches({ status: activeFilter, search: searchQuery }));
    } catch (err) {
      // Error handled by thunk
    }
  };

  const handleApproveDiscount = async (suggestion) => {
    try {
      await dispatch(
        approveDiscount({
          batchId: suggestion.batchId,
          discountPercent: suggestion.suggestedDiscountPercent,
          sellingPrice: suggestion.suggestedPrice,
        })
      );
      dispatch(fetchInventorySummary());
      dispatch(fetchBatches({ status: activeFilter, search: searchQuery }));
    } catch (err) {
      // Handled
    }
  };

  const handleOpenAuditHistory = () => {
    dispatch(fetchInventoryTransactions());
    setShowAuditModal(true);
  };

  const handleRunExpiryCheck = () => {
    dispatch(triggerExpiryCheck());
  };

  const handleDeleteBatch = (batch) => {
    const isExpired = new Date(batch.expiryDate) <= new Date() || batch.expiredStock > 0;
    setConfirmModal({
      isOpen: true,
      title: isExpired ? "Remove Expired Batch" : "Remove Batch",
      message: `Are you sure you want to permanently discard batch "${batch.batchNumber}"? This will update your inventory stock records.`,
      confirmText: "Remove Batch",
      onConfirm: () => {
        dispatch(deleteBatch(batch._id, { status: activeFilter, search: searchQuery }));
      },
    });
  };

  const handleClearExpiredBatches = () => {
    const countInfo = summary.expiredStockTotal > 0 ? `(${summary.expiredStockTotal} units)` : "";
    setConfirmModal({
      isOpen: true,
      title: "Remove All Expired Batches",
      message: `Are you sure you want to purge all expired batches ${countInfo}? This will discard all expired inventory and update product aggregates.`,
      confirmText: "Remove All Expired",
      onConfirm: () => {
        dispatch(clearAllExpiredBatches({ status: activeFilter, search: searchQuery }));
      },
    });
  };

  const getExpiryBadge = (expiryDate) => {
    const now = new Date();
    const exp = new Date(expiryDate);
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle size={12} />
          Expired
        </span>
      );
    }
    if (daysLeft <= 3) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 animate-pulse">
          <Clock size={12} />
          {daysLeft}d left (Critical)
        </span>
      );
    }
    if (daysLeft <= 7) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Clock size={12} />
          {daysLeft}d left (Expiring Soon)
        </span>
      );
    }
    if (daysLeft <= 14) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
          {daysLeft}d left
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        Fresh ({daysLeft}d)
      </span>
    );
  };

  return (
    <div className="space-y-8 mt-12">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers size={14} />
            Smart Batch & Expiry Engine
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Inventory & Batch Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track batches, allocate stock with FEFO priority, and automate discount decisions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenAddBatch()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Batch</span>
          </button>

          <button
            onClick={() => setShowDiscountsModal(true)}
            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-[#1a2235] hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Tag size={15} />
            <span>Smart Discounts</span>
            {summary.pendingSuggestionsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black">
                {summary.pendingSuggestionsCount}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenAuditHistory}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <History size={15} />
            <span>Audit History</span>
          </button>

          <button
            onClick={handleRunExpiryCheck}
            title="Run instant expiry check & alerts"
            className="p-2.5 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Available Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{summary.totalAvailableStock}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Across all active batches</p>
        </div>

        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Expiring Soon</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-300 tracking-tight">{summary.approachingExpiryCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Batches &le; 7 days left</p>
        </div>

        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Expired Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">{summary.expiredStockTotal}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Blocked from sales</p>
        </div>

        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Low Stock Alert</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldAlert size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 tracking-tight">{summary.lowStockCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">&le; 5 units remaining</p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Smart Suggestions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{summary.pendingSuggestionsCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Pending review & approval</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
          {[
            { id: "all", label: "All Batches" },
            { id: "active", label: "Active" },
            { id: "expiring_soon", label: "Expiring Soon" },
            { id: "expired", label: "Expired" },
            { id: "out_of_stock", label: "Out of Stock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search batch number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 transition-all shadow-sm"
          />
        </form>
      </div>

      {/* BATCH TABLE */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-base tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              Batch Inventory Ledger ({totalBatchesCount})
            </h3>
            {summary.expiredStockTotal > 0 && (
              <button
                onClick={handleClearExpiredBatches}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Discard all expired batches from inventory"
              >
                <Trash2 size={13} />
                <span>Remove All Expired ({summary.expiredStockTotal} units)</span>
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500 font-medium">Sorted by FEFO (Earliest Expiring First)</span>
        </div>

        {/* Expired Filter Guidance Banner */}
        {activeFilter === "expired" && batches.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200/80 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs font-medium">
                Viewing <span className="font-bold">{batches.length}</span> expired batch{batches.length > 1 ? "es" : ""}. Review items below before removing them individually or clearing all.
              </p>
            </div>
            <button
              onClick={handleClearExpiredBatches}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Trash2 size={13} />
              <span>Remove All Expired Batches</span>
            </button>
          </div>
        )}

        {batches.length === 0 ? (
          <div className="text-center py-16">
            <Package size={36} className="text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-700 dark:text-gray-300">No batches found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Add your first inventory batch or adjust your filters above.
            </p>
            <button
              onClick={() => handleOpenAddBatch()}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus size={14} />
              <span>Create Initial Batch</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">Sold</th>
                  <th className="py-3 px-4 text-center">Expired</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Pricing & Discount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {batches.map((batch, index) => {
                  const product = batch.product || {};
                  return (
                    <tr key={batch._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                            <ProductImage
                              src={product.image}
                              alt={product.name}
                              category={product.category}
                              className="w-full h-full object-cover"
                              iconSize={14}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-gray-900 dark:text-gray-200">{product.name || "Unknown Product"}</p>
                              {!batch.product && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                                  Deleted Product
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500">{product.category || (!batch.product ? "Orphaned batch — click trash to remove" : "")}</p>
                          </div>
                        </div>
                      </td>

                      {/* Batch Number & FEFO rank */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <span>{batch.batchNumber}</span>
                          {index === 0 && batch.availableStock > 0 && new Date(batch.expiryDate) > new Date() && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40">
                              FEFO #1
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock balances */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {batch.availableStock}
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-600 dark:text-gray-400">
                        {batch.soldStock || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600 dark:text-rose-400 font-semibold">
                        {batch.expiredStock || 0}
                      </td>

                      {/* Expiry Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getExpiryBadge(batch.expiryDate)}
                          <span className="text-[10px] text-gray-500">
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Price & Suggested Discount */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-gray-900 dark:text-white">₹{product.discountPrice || 0}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through">₹{product.marketPrice || 0}</span>
                          </div>
                          {batch.appliedDiscountPercent > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Active: {batch.appliedDiscountPercent}% OFF
                            </span>
                          ) : batch.suggestedDiscountPercent > 0 ? (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              Suggested: {batch.suggestedDiscountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(batch)}
                            title="Adjust batch stock"
                            className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch)}
                            title={new Date(batch.expiryDate) <= new Date() || batch.expiredStock > 0 ? "Remove expired batch" : "Remove batch"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              new Date(batch.expiryDate) <= new Date() || batch.expiredStock > 0
                                ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                                : "bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
                            }`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: ADD BATCH MODAL ─── */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-600 dark:text-emerald-400" />
                Add New Inventory Batch
              </h3>
              <button
                onClick={() => setShowAddBatchModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAddBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Product *</label>
                <select
                  value={batchFormData.productId}
                  onChange={(e) => setBatchFormData({ ...batchFormData, productId: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                  required
                >
                  <option value="">-- Choose product --</option>
                  {myListings.map((p) => (
                    <option key={p._id} value={p._id} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Batch Number *</label>
                  <input
                    type="text"
                    value={batchFormData.batchNumber}
                    onChange={(e) => setBatchFormData({ ...batchFormData, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-A01"
                    className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={batchFormData.quantity}
                    onChange={(e) => setBatchFormData({ ...batchFormData, quantity: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={batchFormData.expiryDate}
                    onChange={(e) => setBatchFormData({ ...batchFormData, expiryDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cost Price (₹, optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={batchFormData.costPrice}
                    onChange={(e) => setBatchFormData({ ...batchFormData, costPrice: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {loading ? "Adding..." : "Add Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SMART DISCOUNT SUGGESTIONS MODAL ─── */}
      {showDiscountsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Tag size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Intelligent Expiry Discount Recommendations
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Suggested discounts based on remaining shelf life and category perishability to prevent waste.
                </p>
              </div>
              <button
                onClick={() => setShowDiscountsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={32} className="text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">All batches are fresh</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No discount recommendations needed at this time.</p>
                </div>
              ) : (
                suggestions.map((sug) => (
                  <div
                    key={sug.batchId}
                    className="p-4 bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{sug.productName}</span>
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {sug.batchNumber}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1">
                        ⏰ {sug.daysRemaining} days left • {sug.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Current: ₹{sug.currentDiscountPrice || sug.originalPrice}</span>
                        <ArrowRight size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          Suggested: ₹{sug.suggestedPrice}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold rounded text-[10px] border border-emerald-200 dark:border-transparent">
                          {sug.suggestedDiscountPercent}% OFF
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveDiscount(sug)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
                    >
                      Approve &amp; Apply
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowDiscountsModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADJUST BATCH STOCK MODAL ─── */}
      {showAdjustModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                Adjust Stock: {selectedBatch.batchNumber}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjust} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Available Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={adjustFormData.newStock}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, newStock: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Reason for Adjustment *</label>
                <input
                  type="text"
                  value={adjustFormData.reason}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                  placeholder="e.g. Damaged inventory discarded"
                  className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: AUDIT LOG HISTORY MODAL ─── */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-emerald-600 dark:text-emerald-400" />
                Immutable Inventory Audit Log
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {transactions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No transactions recorded yet.</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Product / Batch</th>
                      <th className="py-2.5 px-3 text-center">Delta</th>
                      <th className="py-2.5 px-3">Reason / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === "ORDER_PURCHASE"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : tx.type === "ORDER_CANCEL_RESTORE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : tx.type === "EXPIRED_DISCARD"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-800 dark:text-gray-300 font-sans font-medium">
                          {tx.productName || "Product"} ({tx.batchNumber || "—"})
                        </td>
                        <td
                          className={`py-2.5 px-3 text-center font-bold ${
                            tx.quantityDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-sans text-[11px] truncate max-w-[200px]">
                          {tx.reason || tx.referenceId || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

export default InventoryManagement;
