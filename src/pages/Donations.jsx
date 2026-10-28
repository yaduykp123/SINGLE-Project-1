import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import ProductImage from "../components/ProductImage";
import {
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Clock,
  MapPin,
  Plus,
  Check,
  X,
  AlertCircle,
  Calendar,
  Sparkles,
  Package,
  Users,
  Building,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { isValidPhone, getPhoneError } from "../utils/validation";

const CATEGORIES = [
  "All",
  "Bakery",
  "Fruits",
  "Vegetables",
  "Dairy",
  "Prepared Meals",
  "Grocery Items",
  "Other",
];

const Donations = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [donations, setDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [claimedDonations, setClaimedDonations] = useState([]);
  const [impactStats, setImpactStats] = useState({
    totalCompletedDonations: 0,
    totalMealsRescued: 0,
    totalCo2SavedKg: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse"); // 'browse' | 'my-listings' | 'my-claims'
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [targetDonation, setTargetDonation] = useState(null);

  // Claim form state
  const [claimForm, setClaimForm] = useState({
    ngoName: "",
    ngoPhone: "",
    ngoRegistrationNumber: "",
    notes: "",
  });

  // Verify OTP state
  const [verifyOtp, setVerifyOtp] = useState("");

  // Create Donation form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "Bakery",
    quantity: 10,
    unit: "kg",
    image: "",
    expiryDate: "",
    pickupStartDate: "",
    pickupEndDate: "",
    pickupInstructions: "Please bring clean insulated food bags or containers.",
    foodSafetyConfirmed: false,
    street: "",
  });

  const isSeller = user?.accountType === "shop" || user?.isAdmin;

  useEffect(() => {
    fetchDonationsData();
  }, [selectedCategory]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (isSeller) fetchMyDonations();
      fetchClaimedDonations();
    }
  }, [isAuthenticated, user]);

  const fetchDonationsData = async () => {
    setLoading(true);
    try {
      const catParam = selectedCategory !== "All" ? `?category=${encodeURIComponent(selectedCategory)}` : "";
      const [listRes, impactRes] = await Promise.all([
        axiosInstance.get(`/donations${catParam}`),
        axiosInstance.get("/donations/impact"),
      ]);
      setDonations(listRes.data.donations || []);
      setImpactStats(impactRes.data.stats || {});
    } catch {
      toast.error("Failed to load surplus food donations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDonations = async () => {
    try {
      const res = await axiosInstance.get("/donations/my-donations");
      setMyDonations(res.data.donations || []);
    } catch {
      // Non-critical
    }
  };

  const fetchClaimedDonations = async () => {
    try {
      const res = await axiosInstance.get("/donations/my-claims");
      setClaimedDonations(res.data.donations || []);
    } catch {
      // Non-critical
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to publish your surplus food donation.");
      navigate("/login");
      return;
    }

    if (!createForm.foodSafetyConfirmed) {
      toast.error("You must confirm food safety & hygienic handling.");
      return;
    }

    try {
      await axiosInstance.post("/donations", createForm);
      toast.success("Surplus food donation listed successfully!");
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        description: "",
        category: "Bakery",
        quantity: 10,
        unit: "kg",
        image: "",
        expiryDate: "",
        pickupStartDate: "",
        pickupEndDate: "",
        pickupInstructions: "Please bring clean insulated food bags or containers.",
        foodSafetyConfirmed: false,
        street: "",
      });
      fetchDonationsData();
      if (isSeller) fetchMyDonations();
      setActiveTab(isSeller ? "my-listings" : "browse");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to list donation");
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!targetDonation) return;

    if (!claimForm.ngoName?.trim() || claimForm.ngoName.trim().length < 2) {
      toast.error("Please enter a valid NGO / organization name (min 2 characters)");
      return;
    }

    const phoneErr = getPhoneError(claimForm.ngoPhone);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }

    try {
      const res = await axiosInstance.post(`/donations/${targetDonation._id}/claim`, claimForm);
      toast.success("Claim request submitted! Pickup OTP generated.");
      setShowClaimModal(false);
      setClaimForm({ ngoName: "", ngoPhone: "", ngoRegistrationNumber: "", notes: "" });
      fetchDonationsData();
      fetchClaimedDonations();
      setActiveTab("my-claims");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit claim request");
    }
  };

  const handleApproveClaim = async (donationId) => {
    try {
      await axiosInstance.put(`/donations/${donationId}/approve`);
      toast.success("Donation claim approved. Ready for collection.");
      fetchMyDonations();
      fetchDonationsData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve claim");
    }
  };

  const handleVerifyPickupSubmit = async (e) => {
    e.preventDefault();
    if (!targetDonation || !verifyOtp) return;

    try {
      await axiosInstance.post(`/donations/${targetDonation._id}/verify-pickup`, {
        otp: verifyOtp,
      });
      toast.success("Pickup verified successfully! Impact recorded.");
      setShowVerifyModal(false);
      setVerifyOtp("");
      fetchMyDonations();
      fetchDonationsData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid pickup verification OTP");
    }
  };

  const renderDonationForm = (isModal = false) => {
    const todayStr = new Date().toISOString().split("T")[0];

    return (
      <form onSubmit={handleCreateDonation} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Donation Title <span className="text-emerald-600 dark:text-emerald-400">*</span>
          </label>
          <input
            type="text"
            required
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder="e.g. 25 Fresh Vegetable Pastries & Sandwiches"
            className="w-full bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Description & Dietary Details
          </label>
          <textarea
            rows={2}
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="e.g. Vegetarian, freshly baked this morning, individually packed in paper boxes."
            className="w-full bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Category <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              className="w-full bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Quantity & Unit <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                required
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                className="w-24 bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <select
                value={createForm.unit}
                onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                className="flex-1 bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="kg">kg</option>
                <option value="units">units</option>
                <option value="packs">packs</option>
                <option value="meals">meals</option>
                <option value="box">box</option>
                <option value="ltr">ltr</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Expiry / Best Before <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={createForm.expiryDate}
              onChange={(e) => setCreateForm({ ...createForm, expiryDate: e.target.value })}
              className="w-full bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Pickup Deadline <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={createForm.pickupEndDate}
              onChange={(e) => setCreateForm({ ...createForm, pickupEndDate: e.target.value })}
              className="w-full bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Pickup Instructions & Location Details
          </label>
          <input
            type="text"
            value={createForm.pickupInstructions}
            onChange={(e) => setCreateForm({ ...createForm, pickupInstructions: e.target.value })}
            placeholder="e.g. Shop #4, rear bakery entrance, ring buzzer upon arrival"
            className="w-full bg-white dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Mandatory Food Safety Confirmation */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 mt-2">
          <input
            type="checkbox"
            id={isModal ? "safetyCheckModal" : "safetyCheckInline"}
            required
            checked={createForm.foodSafetyConfirmed}
            onChange={(e) => setCreateForm({ ...createForm, foodSafetyConfirmed: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
          />
          <label htmlFor={isModal ? "safetyCheckModal" : "safetyCheckInline"} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-none">
            <strong className="text-emerald-700 dark:text-emerald-400">Food Safety Declaration:</strong> I confirm this surplus food is wholesome, unadulterated, stored under proper hygienic temperatures, and safe for human consumption.
          </label>
        </div>

        <div className="pt-2 flex items-center gap-3">
          {isModal && (
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isModal ? "flex-1" : "w-full"
            }`}
          >
            <Plus size={16} />
            <span>Publish Donation Listing</span>
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 pt-20 sm:pt-24 lg:pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-md shadow-sm">
              <HeartHandshake size={15} />
              <span>Surplus Food Relief Initiative</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Community Food Rescue & Donations
            </h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Connecting verified grocers, bakeries, and kitchens with local NGOs and food banks to divert surplus food directly to people in need.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("create");
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all border border-emerald-400/30 cursor-pointer"
            >
              <Plus size={18} />
              <span>List Surplus Food</span>
            </button>
          </div>
        </div>

        {/* Real-time Environmental & Social Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-emerald-500/20 backdrop-blur-xl p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {(impactStats.totalMealsRescued || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Estimated Meals Provided</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-emerald-500/20 backdrop-blur-xl p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
              <Leaf size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {(impactStats.totalCo2SavedKg || 0).toLocaleString()} kg
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">CO2e Emissions Diverted</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-emerald-500/20 backdrop-blur-xl p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {(impactStats.totalCompletedDonations || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed Rescue Drives</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("browse")}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "browse"
                ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Available Donations ({donations.length})
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "create"
                ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            List Surplus Food (Form)
          </button>

          {isSeller && (
            <button
              onClick={() => setActiveTab("my-listings")}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === "my-listings"
                  ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              My Donation Listings ({myDonations.length})
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("my-claims")}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === "my-claims"
                  ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              My Claims & OTPs ({claimedDonations.length})
            </button>
          )}
        </div>

        {/* TAB 1: BROWSE DONATIONS */}
        {activeTab === "browse" && (
          <div>
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                      : "bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800 dark:hover:text-white dark:hover:border-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading surplus donations...</div>
            ) : donations.length === 0 ? (
              <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/40 dark:border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                <HeartHandshake size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No active surplus donations right now</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Check back soon or list fresh surplus food if you are a food vendor or shopkeeper.
                </p>
                {isSeller && (
                  <button
                    onClick={() => setActiveTab("create")}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Create Donation Listing</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donations.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  const isMine = user?._id && item.donor?._id === user._id;

                  return (
                    <div
                      key={item._id}
                      className="bg-white border border-gray-200 hover:border-emerald-500/40 shadow-sm hover:shadow-md dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/40 rounded-2xl p-5 transition-colors duration-200 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image & Badges */}
                        <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 bg-gray-50 dark:bg-gray-950 flex items-center justify-center border border-gray-100 dark:border-gray-800/60">
                          <ProductImage
                            src={item.image}
                            alt={item.title}
                            category={item.category}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-sm">
                              {item.category}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-emerald-700 border border-emerald-200 dark:bg-gray-950/80 dark:text-emerald-400 dark:border-emerald-500/30 backdrop-blur-md shadow-sm">
                              <ShieldCheck size={13} />
                              <span>Safety Certified</span>
                            </span>
                          </div>
                        </div>

                        {/* Title & Quantity */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          <span className="shrink-0 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-xs font-bold">
                            {item.quantity} {item.unit}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{item.description}</p>
                        )}

                        {/* Key Info */}
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800/80 pt-3 mb-4">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Clock size={14} className="text-amber-500 shrink-0" />
                            <span>
                              Best Before:{" "}
                              <strong className="text-amber-700 dark:text-amber-300">
                                {new Date(item.expiryDate).toLocaleDateString()} ({daysLeft}d left)
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Calendar size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              Pickup: {new Date(item.pickupWindow?.startDate).toLocaleDateString()} -{" "}
                              {new Date(item.pickupWindow?.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <MapPin size={14} className="text-blue-500 shrink-0" />
                            <span>{item.city || item.donor?.city || "Local Pick-up"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Building size={14} className="text-purple-500 shrink-0" />
                            <span>Donor: <strong className="text-gray-800 dark:text-gray-200">{item.donorName}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {item.status === "available" ? (
                          isMine ? (
                            <span className="block w-full py-2.5 rounded-xl bg-gray-100 text-center text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Your Listing
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setTargetDonation(item);
                                setClaimForm((prev) => ({
                                   ...prev,
                                  ngoName: user?.fullName || "",
                                  ngoPhone: user?.phone || "",
                                }));
                                setShowClaimModal(true);
                              }}
                              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 border border-emerald-400/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <HeartHandshake size={16} />
                              <span>Claim as NGO / Volunteer</span>
                            </button>
                          )
                        ) : (
                          <span className="block w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 text-center text-xs font-semibold dark:text-amber-400 capitalize">
                            Status: {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY DONATION LISTINGS (FOR SELLERS) */}
        {activeTab === "my-listings" && isSeller && (
          <div className="space-y-4">
            {myDonations.length === 0 ? (
              <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/40 dark:border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                <Package size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No donations listed yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">List surplus stock to feed local communities and log waste diversion impact.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
                >
                  List Food Now
                </button>
              </div>
            ) : (
              myDonations.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        {item.quantity} {item.unit}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        item.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                          : item.status === "approved"
                          ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                          : item.status === "requested"
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Best Before: {new Date(item.expiryDate).toLocaleDateString()} | Claimed by:{" "}
                      <strong className="text-gray-800 dark:text-gray-200">{item.claimedBy?.ngoName || "Unclaimed"}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.status === "requested" && (
                      <button
                        onClick={() => handleApproveClaim(item._id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        Approve Claim
                      </button>
                    )}

                    {item.status === "approved" && (
                      <button
                        onClick={() => {
                          setTargetDonation(item);
                          setShowVerifyModal(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound size={14} />
                        <span>Verify Pickup OTP</span>
                      </button>
                    )}

                    {item.status === "completed" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 size={16} />
                        <span>Completed & Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MY CLAIMS (FOR NGOs / VOLUNTEERS) */}
        {activeTab === "my-claims" && (
          <div className="space-y-4">
            {claimedDonations.length === 0 ? (
              <div className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/40 dark:border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                <HeartHandshake size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No active claims yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Browse available listings to request surplus food for your relief kitchen or shelter.</p>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Browse Food Listings
                </button>
              </div>
            ) : (
              claimedDonations.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        {item.quantity} {item.unit}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        item.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                          : item.status === "approved"
                          ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Donor: <strong className="text-gray-800 dark:text-gray-200">{item.donorName}</strong> ({item.donorPhone}) |{" "}
                      Location: {item.street || item.city}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Instructions: {item.pickupWindow?.instructions}
                    </p>
                  </div>

                  {item.pickupOtp && item.status !== "completed" && (
                    <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded-xl px-4 py-3 text-center shrink-0">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Pickup OTP</p>
                      <p className="text-xl font-extrabold text-gray-900 dark:text-white tracking-widest">{item.pickupOtp}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Give this OTP to donor at collection</p>
                    </div>
                  )}

                  {item.status === "completed" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 size={16} />
                      <span>Handoff Completed</span>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: LIST SURPLUS FOOD (INLINE FORM DIV) */}
        {activeTab === "create" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-emerald-200 shadow-xl dark:bg-gray-900/80 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <HeartHandshake size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">List Surplus Food for Donation</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Divert edible surplus food to verified local shelters & food banks</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shrink-0 self-start sm:self-auto">
                  <ShieldCheck size={14} />
                  <span>Food Safety Standard</span>
                </span>
              </div>

              {!isAuthenticated && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>You are filling this as a guest. You will be prompted to sign in when submitting.</span>
                  </div>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 underline shrink-0"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {renderDonationForm(false)}
            </div>
          </div>
        )}

        {/* MODAL 1: CLAIM REQUEST MODAL */}
        {showClaimModal && targetDonation && (
          <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-24 pb-12 overflow-y-auto">
            <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-auto sm:my-4">
              <button
                onClick={() => setShowClaimModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Claim Surplus Food</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Claiming <strong className="text-emerald-600 dark:text-emerald-400">{targetDonation.title}</strong> ({targetDonation.quantity} {targetDonation.unit})
              </p>

              <form onSubmit={handleClaimSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">NGO / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={claimForm.ngoName}
                    onChange={(e) => setClaimForm({ ...claimForm, ngoName: e.target.value })}
                    placeholder="e.g. Robin Hood Army / Seva Kitchen"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Coordinator Phone Number (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={claimForm.ngoPhone?.startsWith("+") ? 13 : 10}
                    value={claimForm.ngoPhone}
                    onChange={(e) => {
                      let clean = e.target.value.replace(/[^\d+]/g, "");
                      if (clean.indexOf("+") > 0) clean = clean.replace(/\+/g, "");
                      const limit = clean.startsWith("+91") ? 13 : 10;
                      setClaimForm({ ...claimForm, ngoPhone: clean.slice(0, limit) });
                    }}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">NGO Reg. / Trust ID (Optional)</label>
                  <input
                    type="text"
                    value={claimForm.ngoRegistrationNumber}
                    onChange={(e) => setClaimForm({ ...claimForm, ngoRegistrationNumber: e.target.value })}
                    placeholder="e.g. NGO-MH-2023-XXXX"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Pickup Notes / Vehicle Info</label>
                  <textarea
                    rows={2}
                    value={claimForm.notes}
                    onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                    placeholder="e.g. Arriving at 6 PM with 2 volunteers and refrigerated crates"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all mt-2 cursor-pointer"
                >
                  Submit Claim & Get Pickup OTP
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: VERIFY PICKUP OTP (FOR DONOR) */}
        {showVerifyModal && targetDonation && (
          <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-24 pb-12 overflow-y-auto">
            <div className="bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-auto sm:my-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Verify Physical Handoff</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Ask the collection volunteer from <strong className="text-emerald-600 dark:text-emerald-400">{targetDonation.claimedBy?.ngoName}</strong> for the 6-digit pickup OTP.
              </p>

              <form onSubmit={handleVerifyPickupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Enter 6-Digit Pickup OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyOtp}
                    onChange={(e) => setVerifyOtp(e.target.value)}
                    placeholder="e.g. 548912"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-center text-xl font-mono text-emerald-600 dark:text-emerald-400 tracking-widest outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Verify & Complete Donation
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: CREATE DONATION LISTING */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-24 pb-12 overflow-y-auto">
            <div className="bg-white border border-gray-200 shadow-2xl dark:bg-gray-900 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full my-auto sm:my-4 relative">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-6 pr-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">List Surplus Food for Donation</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Help feed local shelters instead of throwing edible food away.</p>
                </div>
              </div>

              {renderDonationForm(true)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donations;
