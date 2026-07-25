import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../redux/thunks/notificationThunks";
import { Bell, CheckCheck, Sparkles, Clock, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = (id) => {
    dispatch(markNotificationRead(id));
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles size={14} />
              <span>Real-Time Updates</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-emerald-500 text-gray-950 font-black px-2.5 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-emerald-500/40 text-xs font-bold text-emerald-400 rounded-xl transition-all"
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-20 bg-[#111827]/50 border border-gray-800 rounded-3xl p-8">
            <Bell size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Notifications Yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
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
                  ? "bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20"
                  : "bg-[#111827]/60 border-gray-800/80 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.isRead
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-800/60 text-gray-400 border border-gray-700/50"
                  }`}
                >
                  <Bell size={18} />
                </div>

                <div>
                  <p
                    className={`text-sm leading-relaxed ${
                      !n.isRead ? "font-bold text-white" : "font-medium text-gray-300"
                    }`}
                  >
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(n.createdAt).toLocaleString()}
                    </span>

                    {n.link && (
                      <Link
                        to={n.link}
                        className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!n.isRead ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-2"></span>
              ) : (
                <Check size={16} className="text-gray-600 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Notifications;
