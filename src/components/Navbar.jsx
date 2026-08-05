import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import {
  logoutUser,
  updateUserLocation as updateLocationThunk,
} from "../redux/thunks/authThunks";
import { fetchNotifications } from "../redux/thunks/notificationThunks";
import { fetchCart } from "../redux/thunks/cartThunks";
import { fetchMyOrders, fetchReceivedOrders, invalidateOrderCache } from "../redux/thunks/orderThunks";
import { addNotification } from "../redux/slices/notificationSlice";
import { addOffer } from "../redux/slices/offerSlice";
import { updateOrderStatusInState } from "../redux/slices/orderSlice";
import {
  ShoppingBag,
  MapPin,
  ClipboardList,
  Bell,
  LogOut,
  User,
  Crosshair,
  LayoutDashboard,
  ChevronDown,
  Menu,
  X,
  Loader2,
  Shield,
  Tag,
  Ban,
  Leaf,
  CalendarClock,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";
import LocationPicker from "./LocationPicker";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { cart } = useSelector((state) => state.cart);
  const cartCount = cart?.itemCount || 0;

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

  // REAL-TIME SOCKET.IO NOTIFICATIONS LISTENERS

  useEffect(() => {
    if (isAuthenticated && user && user._id) {
      // 1. Initial fetch of notifications and cart
      dispatch(fetchNotifications());
      dispatch(fetchCart());

      // 2. Connect Socket.io Client (dynamic URL for localhost & production hosting)
      const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
      const socket = io(socketUrl, {
        transports: ["websocket", "polling"],
      });

      // Join room corresponding to User ID
      socket.on("connect", () => {
        socket.emit("join_room", user._id);
      });
      socket.emit("join_room", user._id);

      // Listen for live "new_offer" events broadcasted by backend
      socket.on("new_offer", (offer) => {
        dispatch(addOffer(offer));
      });

      // Listen for live "order_updated" events broadcasted by backend
      socket.on("order_updated", (payload) => {
        if (payload?.orderId && payload?.status) {
          dispatch(updateOrderStatusInState({ orderId: payload.orderId, status: payload.status }));
        }
        invalidateOrderCache();
        dispatch(fetchMyOrders(true));
        if (user?.accountType === "shop") {
          dispatch(fetchReceivedOrders(true));
        }
      });

      // Listen for live "order_created" events broadcasted by backend
      socket.on("order_created", () => {
        invalidateOrderCache();
        dispatch(fetchMyOrders(true));
        if (user?.accountType === "shop") {
          dispatch(fetchReceivedOrders(true));
        }
      });

      // Listen for live "new_notification" events broadcasted by backend
      socket.on("new_notification", (notification) => {
        dispatch(addNotification(notification));
        if (notification.type === "ORDER") {
          invalidateOrderCache();
          dispatch(fetchMyOrders(true));
          dispatch(fetchReceivedOrders(true));
        }

        // Custom Toast Notification popup
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Live Alert • Tap to view
                </p>
              </div>
            </div>
          ),
          { duration: 5000 },
        );
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
            }),
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
            }),
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
    return city
      .replace(/\s+Taluk$/i, "")
      .replace(/\s+District$/i, "")
      .trim();
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
        },
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
          }),
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
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  if (!isAuthenticated || !user) return null;

  const locationText =
    user.city && user.state
      ? `${user.city}, ${user.state}`
      : user.city || "Set Location";

  const navLinks = [];

  if (user?.isAdmin) {
    navLinks.push({ to: "/admin", icon: Shield, label: "Admin Panel" });
    navLinks.push({
      to: "/notifications",
      icon: Bell,
      label: "Notifications",
      hasBadge: true,
      badgeValue: unreadCount,
    });
  } else if (user.accountType === "household") {
    navLinks.push({ to: "/products", icon: ShoppingBag, label: "Products" });
    navLinks.push({ to: "/offers", icon: Tag, label: "Offers" });
    navLinks.push({
      to: "/cart",
      icon: ShoppingCart,
      label: "Cart",
      hasBadge: true,
      badgeValue: cartCount,
    });
    navLinks.push({
      to: "/my-listings",
      icon: ClipboardList,
      label: "My Listings",
    });
    navLinks.push({
      to: "/reminders",
      icon: CalendarClock,
      label: "Reminders",
    });
    navLinks.push({ to: "/orders", icon: ClipboardList, label: "Orders" });
    navLinks.push({
      to: "/notifications",
      icon: Bell,
      label: "Notifications",
      hasBadge: true,
      badgeValue: unreadCount,
    });
  } else if (user.accountType === "shop") {
    navLinks.push({
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    });
    navLinks.push({ to: "/offers", icon: Tag, label: "Offers" });
    navLinks.push({
      to: "/my-listings",
      icon: ClipboardList,
      label: "My Listings",
    });
    navLinks.push({
      to: "/reminders",
      icon: CalendarClock,
      label: "Reminders",
    });
    navLinks.push({ to: "/orders", icon: ClipboardList, label: "Orders" });
    navLinks.push({
      to: "/notifications",
      icon: Bell,
      label: "Notifications",
      hasBadge: true,
      badgeValue: unreadCount,
    });
  }

  return (
    <nav className="bg-gray-900/60 backdrop-blur-xl border-b border-gray-800/80 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo — Icon Image + Styled Text */}
          <Link to={user?.isAdmin ? "/admin" : "/"} className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0 border border-emerald-500/30">
              <img 
                src="/Images/LOGO_ExpireOFF-generated.png" 
                alt="expireOFF Icon" 
                className="w-full h-full object-cover bg-white" 
              />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tight flex items-center select-none shrink-0">
              <span className="text-gray-100 font-extrabold">expire</span>
              <span className="text-emerald-400 font-black ml-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]">OFF</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {/* Location — HIDDEN for admin */}
            {!user?.isAdmin && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  disabled={detecting}
                  className="flex items-center gap-1 text-[11px] xl:text-xs text-gray-300 bg-gray-950/60 hover:bg-gray-900 hover:text-emerald-400 px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer border border-gray-800/80 font-medium shadow-inner"
                  title="Click to change location"
                >
                  {detecting ? (
                    <Loader2
                      size={14}
                      className="animate-spin text-emerald-400"
                    />
                  ) : (
                    <MapPin size={14} className="text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[90px] xl:max-w-[130px]">
                    {detecting ? "Detecting..." : locationText}
                  </span>
                  <ChevronDown size={12} className="text-gray-500 shrink-0" />
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
                className="relative flex items-center gap-1 px-2 py-1.5 xl:px-2.5 xl:py-2 text-[11px] xl:text-xs font-semibold text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20 shrink-0"
              >
                <link.icon
                  size={15}
                  className="text-gray-400 group-hover:text-emerald-400 shrink-0"
                />
                <span className="whitespace-nowrap">{link.label}</span>

                {link.hasBadge && Number(link.badgeValue) > 0 && (
                  <span className="ml-0.5 bg-emerald-500 text-gray-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                    {link.badgeValue}
                  </span>
                )}
              </Link>
            ))}

            {/* User + Logout */}
            <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-gray-800 shrink-0">
              <div className="flex items-center gap-1 text-[11px] xl:text-xs text-gray-300 bg-gray-950/40 border border-gray-800/80 px-2.5 py-1.5 rounded-xl">
                <User size={14} className="text-emerald-400 shrink-0" />
                <span className="font-semibold text-white max-w-[70px] xl:max-w-[100px] truncate">
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
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl border border-gray-800/80 transition-all"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-gray-900/95 border-t border-gray-800 px-4 py-4 space-y-2 backdrop-blur-2xl">
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
              {link.hasBadge && (link.badgeValue || unreadCount) > 0 && (
                <span className="ml-1 bg-emerald-500 text-gray-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {link.badgeValue || unreadCount}
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
      <LocationPicker
        isOpen={showManualPicker}
        onClose={() => setShowManualPicker(false)}
      />
    </nav>
  );
};

export default Navbar;
