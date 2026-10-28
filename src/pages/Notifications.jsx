import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationThunk,
  clearAllNotificationsThunk,
} from "../redux/thunks/notificationThunks";
import { Bell, CheckCheck, Sparkles, Clock, ArrowRight, Trash2, Settings, Shield, Sliders } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );

  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    orderUpdates: true,
    expiryAlerts: true,
    promotions: true,
  });

  useEffect(() => {
    axiosInstance
      .get("/users/notification-preferences")
      .then((res) => {
        if (res.data?.success && res.data.preferences) {
          setPreferences(res.data.preferences);
        }
      })
      .catch(() => {});
  }, []);

  const handleTogglePref = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await axiosInstance.put("/users/notification-preferences", updated);
      toast.success("Preferences updated");
    } catch (err) {
      setPreferences(preferences);
      toast.error("Failed to save preference");
    }
  };

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleViewNow = (e, n) => {
    e.stopPropagation();
    if (!n.isRead) {
      dispatch(markNotificationRead(n._id));
    }
    const targetLink =
      n.link ||
      (n.entityType === "order" && n.entityId
        ? `/orders?orderId=${n.entityId}`
        : n.entityType === "offer" && n.entityId
        ? `/offers?offerId=${n.entityId}`
        : "/orders");
    navigate(targetLink);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotificationThunk(id));
  };

  const handleClearAll = () => {
    setConfirmClearAllOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f17] dark:text-gray-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles size={14} />
              <span>Real-Time Updates</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-950 font-black px-2.5 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showPreferences
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-400 dark:border-emerald-500/40"
                  : "bg-white border-gray-200 text-gray-700 hover:text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:text-white"
              }`}
              title="Notification settings"
            >
              <Settings size={15} />
              <span>Preferences</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-emerald-500 text-xs font-bold text-emerald-700 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-500/40 dark:text-emerald-400 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <CheckCheck size={16} />
                <span>Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-red-300 text-xs font-bold text-gray-500 hover:text-red-600 dark:bg-gray-900/80 dark:border-gray-800 dark:hover:border-red-500/40 dark:text-gray-400 dark:hover:text-red-400 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Clear all notifications"
              >
                <Trash2 size={15} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification Preferences Drawer */}
        {showPreferences && (
          <div className="bg-white border border-gray-200 dark:bg-gray-900/80 dark:border-gray-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-sm dark:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sliders size={16} className="text-emerald-600 dark:text-emerald-400" />
                  Alert & Delivery Preferences
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Control which channels and types of alerts you receive
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                Auto-saved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: "emailNotifications",
                  title: "Email Receipts & Notices",
                  desc: "Invoices, order confirmations, and donation receipts",
                },
                {
                  key: "orderUpdates",
                  title: "Order Status Updates",
                  desc: "Live notifications on order confirmation, packing & delivery",
                },
                {
                  key: "expiryAlerts",
                  title: "Expiry Reminders",
                  desc: "Critical alerts for products approaching shelf expiration",
                },
                {
                  key: "promotions",
                  title: "Flash Deals & Surplus Offers",
                  desc: "Special discounted offers and nearby food rescues",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-950/60 dark:border-gray-800/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref(item.key)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      preferences[item.key] ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-800"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences[item.key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-20 bg-white border border-gray-200 shadow-sm dark:bg-[#111827]/50 dark:border-gray-800 rounded-3xl p-8">
            <Bell size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Notifications Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              You will receive live alerts when new nearby offers are created or when orders change status.
            </p>
          </div>
        )}

        {/* List of Notifications */}
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n._id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 ${
                !n.isRead
                  ? "bg-emerald-50/70 border-emerald-200 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:shadow-lg dark:shadow-emerald-950/20"
                  : "bg-white border-gray-200/80 hover:border-gray-300 shadow-sm dark:bg-[#111827]/60 dark:border-gray-800/80 dark:hover:border-gray-700"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.isRead
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                      : "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700/50"
                  }`}
                >
                  <Bell size={18} />
                </div>

                <div>
                  {n.title && (
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                      {n.title}
                    </h4>
                  )}
                  <p
                    className={`text-sm leading-relaxed ${
                      !n.isRead ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(n.createdAt).toLocaleString()}
                    </span>

                    <button
                      onClick={(e) => handleViewNow(e, n)}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Now</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 mt-1">
                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0"></span>
                )}
                <button
                  onClick={(e) => handleDelete(e, n._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmClearAllOpen}
        title="Clear All Notifications"
        message="Are you sure you want to permanently clear all notifications from your inbox?"
        confirmText="Clear All"
        onConfirm={() => {
          dispatch(clearAllNotificationsThunk());
          setConfirmClearAllOpen(false);
        }}
        onClose={() => setConfirmClearAllOpen(false)}
      />
    </div>
  );
};

export default Notifications;
