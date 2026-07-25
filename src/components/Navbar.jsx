import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { logoutUser, updateUserLocation as updateLocationThunk } from "../redux/thunks/authThunks";
import { fetchNotifications } from "../redux/thunks/notificationThunks";
import { addNotification } from "../redux/slices/notificationSlice";
import {
  ShoppingBag, MapPin, ClipboardList, Bell, LogOut,
  User, Crosshair, LayoutDashboard, ChevronDown, Menu, X, Loader2, Shield,
  Tag, Ban, Leaf, CalendarClock
} from "lucide-react";
import toast from "react-hot-toast";
import LocationPicker from "./LocationPicker";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser(navigate));
    setMobileOpen(false);
  };

  // -------------------------------------------------------------
  // REAL-TIME SOCKET.IO NOTIFICATIONS LISTENERS
  // -------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated && user && user._id) {
      // 1. Initial fetch of notifications
      dispatch(fetchNotifications());

      // 2. Connect Socket.io Client
      const socket = io("http://localhost:5000");

      // Join room corresponding to User ID
      socket.emit("join_room", user._id);

      // Listen for live "new_notification" events broadcasted by backend
      socket.on("new_notification", (notification) => {
        dispatch(addNotification(notification));
        
        // Custom Toast Notification popup
        toast((t) => (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">Live Alert • Tap to view</p>
            </div>
          </div>
        ), { duration: 5000 });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?._id, isAuthenticated, dispatch]);

  const detectLocationByIpFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data && data.city && data.city !== "Not found") {
          dispatch(
            updateLocationThunk({
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              city: data.city,
              state: data.region || "",
              country: data.country_name || "",
            })
          );
          setDetecting(false);
          toast.success(`Location set to ${data.city}!`);
          return true;
        }
      }
    } catch (e) {}

    try {
      const res = await fetch("https://geolocation-db.com/json/");
      if (res.ok) {
        const data = await res.json();
        if (data && data.city && data.city !== "Not found") {
          dispatch(
            updateLocationThunk({
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              city: data.city,
              state: data.state || "",
              country: data.country_name || "",
            })
          );
          setDetecting(false);
          toast.success(`Location set to ${data.city}!`);
          return true;
        }
      }
    } catch (e) {}

    setDetecting(false);
    return false;
  };

  const extractCityFromAddress = (address) => {
    if (!address) return "";
    const city =
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town ||
      address.city ||
      address.municipality ||
      address.city_district ||
      address.district ||
      address.county ||
      address.state_district ||
      "";
    return city.replace(/\s+Taluk$/i, "").replace(/\s+District$/i, "").trim();
  };

  const saveCoordinatesAndGeocode = async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "expireOff-app/1.0 (contact@expireoff.com)",
          },
        }
      );
      const data = await res.json();
      const address = data.address || {};
      const detectedCity = extractCityFromAddress(address);

      if (detectedCity) {
        dispatch(
          updateLocationThunk({
            latitude,
            longitude,
            city: detectedCity,
            state: address.state || "",
            country: address.country || "",
          })
        );
        toast.success(`Location set to ${detectedCity}!`);
      } else {
        await detectLocationByIpFallback();
      }
    } catch (error) {
      await detectLocationByIpFallback();
    }
    setDetecting(false);
  };

  const detectLocation = () => {
    setDetecting(true);

    if (!navigator.geolocation) {
      detectLocationByIpFallback();
      return;
    }

    // 1. Try High Accuracy GPS / Wi-Fi positioning first
    navigator.geolocation.getCurrentPosition(
      saveCoordinatesAndGeocode,
      (firstError) => {
        // 2. If high accuracy fails or times out, try standard accuracy
        navigator.geolocation.getCurrentPosition(
          saveCoordinatesAndGeocode,
          (secondError) => {
            // 3. Fallback silently to IP lookup without opening modal
            detectLocationByIpFallback();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!isAuthenticated || !user) return null;

  const locationText =
    user.city && user.state ? `${user.city}, ${user.state}` : user.city || "Set Location";

  const navLinks = [];

  if (user?.isAdmin) {
    navLinks.push({ to: "/admin", icon: Shield, label: "Admin Panel" });
    navLinks.push({ to: "/offers", icon: Tag, label: "Offers" });
    navLinks.push({ to: "/reminders", icon: CalendarClock, label: "Reminders" });
    navLinks.push({ to: "/notifications", icon: Bell, label: "Notifications", hasBadge: true });
  } else if (user.accountType === "household") {
    navLinks.push({ to: "/products", icon: ShoppingBag, label: "Products" });
    navLinks.push({ to: "/offers", icon: Tag, label: "Offers" });
    navLinks.push({ to: "/my-listings", icon: ClipboardList, label: "My Listings" });
    navLinks.push({ to: "/reminders", icon: CalendarClock, label: "Reminders" });
    navLinks.push({ to: "/orders", icon: ClipboardList, label: "Orders" });
    navLinks.push({ to: "/notifications", icon: Bell, label: "Notifications", hasBadge: true });
  } else if (user.accountType === "shop") {
    navLinks.push({ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" });
    navLinks.push({ to: "/offers", icon: Tag, label: "Offers" });
    navLinks.push({ to: "/my-listings", icon: ClipboardList, label: "My Listings" });
    navLinks.push({ to: "/reminders", icon: CalendarClock, label: "Reminders" });
    navLinks.push({ to: "/orders", icon: ClipboardList, label: "Orders" });
    navLinks.push({ to: "/notifications", icon: Bell, label: "Notifications", hasBadge: true });
  }

  return (
    <nav className="bg-gray-900/60 backdrop-blur-xl border-b border-gray-800/80 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <svg width="0" height="0" className="absolute">
              <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d5d3d2ff" />
                <stop offset="33%" stopColor="#c06437ff" />
                <stop offset="66%" stopColor="#adec10ff" />
                <stop offset="100%" stopColor="#1be9b9ff" />
              </linearGradient>

              <linearGradient id="rainbow-gradients" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#50de34ff" />
                <stop offset="33%" stopColor="#48d52fff" />
                <stop offset="66%" stopColor="#5f864dff" />
                <stop offset="100%" stopColor="#11e69fff" />
              </linearGradient>
            </svg>
            <div className="w-8 h-8 bg-emerald-00 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 border border-emerald-400/25 group-hover:scale-105 transition-transform">
              <span className="font-bold text-xs">
                <Ban size={40} strokeWidth={2.5} style={{ stroke: "url(#rainbow-gradient)" }}>
                  <Leaf size={23} strokeWidth={1.3} style={{ stroke: "url(#rainbow-gradients)" }} />
                </Ban>
              </span>
            </div>
            <span className="text-lg font-bold text-emerald-500 tracking-tight hidden sm:inline">
              expireOFF
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {/* Location — HIDDEN for admin */}
            {!user?.isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  disabled={detecting}
                  className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-950/60 hover:bg-gray-900 hover:text-emerald-400 px-3 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer border border-gray-800/80 font-medium shadow-inner"
                  title="Click to change location"
                >
                  {detecting ? (
                    <Loader2 size={15} className="animate-spin text-emerald-400" />
                  ) : (
                    <MapPin size={15} className="text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[140px]">
                    {detecting ? "Detecting..." : locationText}
                  </span>
                  <ChevronDown size={13} className="text-gray-500" />
                </button>

                {/* Location Dropdown */}
                {showLocationPicker && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-2xl">
                    <button
                      onClick={() => {
                        detectLocation();
                        setShowLocationPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-xl transition-all"
                    >
                      <Crosshair size={15} className="text-emerald-400" />
                      Detect Automatically
                    </button>
                    <button
                      onClick={() => {
                        setShowManualPicker(true);
                        setShowLocationPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-xl transition-all"
                    >
                      <MapPin size={15} className="text-emerald-400" />
                      Select Manually
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Nav Links */}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20"
              >
                <link.icon size={16} className="text-gray-400 group-hover:text-emerald-400" />
                <span>{link.label}</span>

                {link.hasBadge && unreadCount > 0 && (
                  <span className="ml-1 bg-emerald-500 text-gray-950 font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}

            {/* User + Logout */}
            <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-800">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-950/40 border border-gray-800/80 px-3 py-1.5 rounded-xl">
                <User size={15} className="text-emerald-400 shrink-0" />
                <span className="font-semibold text-white max-w-[100px] truncate">
                  {user.fullName}
                </span>
                {user?.isAdmin && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-md font-bold ml-0.5">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl border border-gray-800/80 transition-all"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900/95 border-t border-gray-800 px-4 py-4 space-y-2 backdrop-blur-2xl">
          {!user?.isAdmin && (
            <button
              onClick={() => {
                detectLocation();
                setMobileOpen(false);
              }}
              disabled={detecting}
              className="flex items-center gap-2 w-full text-left text-xs text-gray-300 bg-gray-950/60 hover:bg-gray-900 hover:text-emerald-400 px-3.5 py-2.5 rounded-xl mb-2 transition-all disabled:opacity-50 cursor-pointer font-medium border border-gray-800"
            >
              {detecting ? (
                <Loader2 size={16} className="animate-spin text-emerald-400" />
              ) : (
                <MapPin size={16} className="text-emerald-400" />
              )}
              <span>{detecting ? "Detecting..." : locationText}</span>
            </button>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <link.icon size={16} className="text-gray-400" />
                <span>{link.label}</span>
              </div>
              {link.hasBadge && unreadCount > 0 && (
                <span className="bg-emerald-500 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}

          <div className="pt-3 border-t border-gray-800 mt-3 space-y-2">
            <div className="flex items-center gap-2 px-3.5 py-2 text-xs text-gray-300 bg-gray-950/40 border border-gray-800 rounded-xl">
              <User size={16} className="text-emerald-400" />
              <span className="font-semibold text-white">{user.fullName}</span>
              {user?.isAdmin && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-md font-bold">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Location Selection Modal */}
      <LocationPicker isOpen={showManualPicker} onClose={() => setShowManualPicker(false)} />
    </nav>
  );
};

export default Navbar;