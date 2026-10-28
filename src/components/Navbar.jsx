import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import {
  logoutUser,
  updateUserLocation as updateLocationThunk,
} from "../redux/thunks/authThunks";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../redux/thunks/notificationThunks";
import { fetchCart } from "../redux/thunks/cartThunks";
import { initSocketClient, disconnectSocketClient } from "../utils/socketClient";
import { toggleTheme } from "../redux/slices/uiSlice";
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
  CalendarClock,
  ShoppingCart,
  Sparkles,
  HeartHandshake,
  Store,
  Package,
  Flame,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";
import LocationPicker from "./LocationPicker";

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const { cart } = useSelector((state) => state.cart);
  const { theme } = useSelector((state) => state.ui);
  const cartCount = cart?.itemCount || 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showGuestMore, setShowGuestMore] = useState(false);

  const moreDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const guestMoreRef = useRef(null);

  const handleLogout = () => {
    dispatch(logoutUser(navigate));
    setMobileOpen(false);
    setShowUserDropdown(false);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const body = document.body;
    if (nextTheme === "dark") {
      root.classList.add("dark");
      if (body) body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      if (body) body.classList.remove("dark");
    }
    try {
      localStorage.setItem("expireoff-theme", nextTheme);
    } catch {}
    dispatch(toggleTheme());
  };

  // Close dropdowns on click outside & Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target)
      ) {
        setShowMoreDropdown(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setShowNotifDropdown(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setShowLocationPicker(false);
      }
      if (
        guestMoreRef.current &&
        !guestMoreRef.current.contains(event.target)
      ) {
        setShowGuestMore(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowMoreDropdown(false);
        setShowUserDropdown(false);
        setShowNotifDropdown(false);
        setShowLocationPicker(false);
        setShowGuestMore(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close all open popups/drawers on navigation
  useEffect(() => {
    setMobileOpen(false);
    setShowMoreDropdown(false);
    setShowUserDropdown(false);
    setShowNotifDropdown(false);
    setShowLocationPicker(false);
    setShowGuestMore(false);
  }, [location.pathname, location.search]);

  // REAL-TIME SOCKET.IO NOTIFICATIONS & STATE SYNCHRONIZATION
  useEffect(() => {
    if (isAuthenticated && user && user._id) {
      dispatch(fetchNotifications());
      dispatch(fetchCart());

      const socket = initSocketClient(dispatch, user);

      // Listen for notification alerts to display interactive toast with View Now
      const handleToastNotification = (notification) => {
        if (!notification) return;
        toast(
          (t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                if (!notification.isRead && notification._id) {
                  dispatch(markNotificationRead(notification._id));
                }
                const targetUrl =
                  notification.link ||
                  (notification.entityType === "order" && notification.entityId
                    ? `/orders?orderId=${notification.entityId}`
                    : notification.entityType === "offer" && notification.entityId
                    ? `/offers?offerId=${notification.entityId}`
                    : "/notifications");
                navigate(targetUrl);
              }}
              className="flex items-start gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  {notification.title || "New Notification"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  {notification.message}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  View Now →
                </p>
              </div>
            </div>
          ),
          { duration: 5000 }
        );
      };

      if (socket) {
        socket.on("new_notification", handleToastNotification);
      }

      return () => {
        if (socket) {
          socket.off("new_notification", handleToastNotification);
        }
      };
    } else {
      disconnectSocketClient();
    }
  }, [user?._id, user?.accountType, isAuthenticated, dispatch, navigate]);

  const detectLocationByIpFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data && data.city && data.city !== "Not found") {
          dispatch(
            updateLocationThunk({
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
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
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
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

    navigator.geolocation.getCurrentPosition(
      saveCoordinatesAndGeocode,
      () => {
        navigator.geolocation.getCurrentPosition(
          saveCoordinatesAndGeocode,
          () => {
            detectLocationByIpFallback();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isLinkActive = (to) => {
    if (to.includes("?")) {
      return `${location.pathname}${location.search}` === to;
    }
    if (to === "/products") {
      return (
        location.pathname === "/products" &&
        !location.search.includes("highest_discount")
      );
    }
    if (to === "/") {
      return location.pathname === "/";
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  // Location display string
  const locationText =
    user?.city && user?.state
      ? `${user.city}, ${user.state}`
      : user?.city || "Set Location";

  // ==================== GUEST (UNAUTHENTICATED) NAVBAR ====================
  if (!isAuthenticated || !user) {
    const guestPrimaryLinks = [
      { to: "/products", icon: ShoppingBag, label: "Marketplace" },
      {
        to: "/products?sort=highest_discount",
        icon: Flame,
        label: "Hot Deals",
        hasBadge: true,
      },
    ];

    const guestSecondaryLinks = [
      {
        to: "/offers",
        icon: Sparkles,
        label: "Flash Offers",
        description: "Special bundles & bulk discount deals",
      },
      {
        to: "/donations",
        icon: HeartHandshake,
        label: "Community Donations",
        description: "Zero-waste free food sharing & claims",
      },
    ];

    const isGuestMoreActive = guestSecondaryLinks.some((item) =>
      isLinkActive(item.to)
    );

    return (
      <nav className="sticky top-0 z-50 bg-white/95 border-b border-gray-200 text-gray-900 shadow-sm dark:bg-[#090d16]/90 dark:border-gray-800/80 dark:shadow-black/30 dark:text-white backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 rounded-2xl p-1 bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:border-emerald-400/60 transition-all duration-300 flex items-center justify-center shrink-0">
              <img
                src="/Images/fresh-produce-clock.png"
                alt="expireOFF"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white font-heading flex items-center leading-none">
                <span>expire</span>
                <span className="text-emerald-600 dark:text-emerald-400 ml-0.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.45)]">
                  OFF
                </span>
              </span>
              <span className="text-[9px] text-emerald-600/90 dark:text-emerald-400/80 mt-0.5 font-semibold tracking-wider uppercase">
                Zero Food Waste
              </span>
            </div>
          </Link>

          {/* Desktop Center: Major Links + Explore Toggle */}
          <div className="hidden md:flex items-center gap-1.5">
            {guestPrimaryLinks.map((link) => {
              const active = isLinkActive(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 border ${
                    active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                      : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100 border-transparent dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60"
                  }`}
                >
                  <Icon
                    size={14}
                    className={
                      active
                        ? "text-emerald-600 dark:text-emerald-400"
                        : link.hasBadge
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  />
                  <span>{link.label}</span>
                  {link.hasBadge && (
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      Hot
                    </span>
                  )}
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </Link>
              );
            })}

            {/* Explore More Toggle Menu */}
            <div className="relative" ref={guestMoreRef}>
              <button
                onClick={() => setShowGuestMore(!showGuestMore)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                  isGuestMoreActive || showGuestMore
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                    : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100 border-transparent hover:border-gray-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 dark:hover:border-gray-700/50"
                }`}
                aria-expanded={showGuestMore}
              >
                <span>Explore</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 text-gray-500 dark:text-gray-400 ${
                    showGuestMore ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                />
                {isGuestMoreActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
              </button>

              {showGuestMore && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 text-gray-900 shadow-xl dark:bg-[#0c121e]/95 dark:border-gray-800/90 dark:text-gray-100 dark:shadow-2xl rounded-2xl p-2 z-50 backdrop-blur-2xl animate-dropdown">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 px-3 py-1.5">
                    Community & Deals
                  </div>
                  <div className="space-y-1">
                    {guestSecondaryLinks.map((link) => {
                      const active = isLinkActive(link.to);
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setShowGuestMore(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 group border ${
                            active
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-white"
                              : "border-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-gray-800/60 dark:text-gray-300 dark:hover:text-white"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                              active
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-400"
                                : "bg-gray-100 border-gray-200 text-gray-500 group-hover:text-emerald-700 group-hover:border-emerald-300 group-hover:bg-emerald-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:group-hover:text-emerald-400 dark:group-hover:border-emerald-500/30 dark:group-hover:bg-emerald-500/10"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold leading-tight">
                                {link.label}
                              </span>
                              {active && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 mt-0.5 leading-snug line-clamp-1">
                              {link.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl border transition-all cursor-pointer bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 dark:bg-gray-900/60 dark:hover:bg-gray-800 dark:border-gray-800/80 dark:text-gray-300 dark:hover:text-amber-400 shadow-sm"
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={16} className="text-gray-700 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            <button
              onClick={() => setShowManualPicker(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm group"
            >
              <MapPin
                size={13}
                className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"
              />
              <span>Set Location</span>
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="hidden xs:inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-800/80 transition-all cursor-pointer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Guest Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/98 dark:bg-[#0c121e]/98 px-4 py-4 space-y-3 backdrop-blur-2xl animate-dropdown">
            {/* Theme Toggle row in mobile */}
            <button
              onClick={handleThemeToggle}
              className="flex items-center justify-between w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-700" />}
                <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-500">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>

            <button
              onClick={() => {
                setShowManualPicker(true);
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 w-full text-left text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 transition-all"
            >
              <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Select Delivery / Local City</span>
            </button>

            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 px-1 pt-1">
              Explore ExpireOFF
            </div>
            <div className="space-y-1">
              {[...guestPrimaryLinks, ...guestSecondaryLinks].map((link) => {
                const active = isLinkActive(link.to);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold"
                        : "border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{link.label}</span>
                    </div>
                    {link.hasBadge && (
                      <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        Hot
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-1/2 py-2.5 text-center rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="w-1/2 py-2.5 text-center rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}

        {/* Location Picker Modal */}
        <LocationPicker
          isOpen={showManualPicker}
          onClose={() => setShowManualPicker(false)}
        />
      </nav>
    );
  }

  // ==================== AUTHENTICATED USER NAVIGATION ====================

  // Configure Major vs Secondary links depending on account type
  let primaryLinks = [];
  let secondaryLinks = [];

  if (user?.isAdmin) {
    primaryLinks = [{ to: "/admin", icon: Shield, label: "Admin Panel" }];
    secondaryLinks = [];
  } else if (user?.accountType === "household") {
    primaryLinks = [
      { to: "/products", icon: ShoppingBag, label: "Marketplace" },
      { to: "/offers", icon: Tag, label: "Offers" },
      { to: "/orders", icon: Package, label: "My Orders" },
      { to: "/donations", icon: HeartHandshake, label: "Donations" },
    ];
    secondaryLinks = [
      {
        to: "/my-listings",
        icon: Store,
        label: "My Listings",
        description: "Products you listed for sale",
      },
      {
        to: "/reminders",
        icon: CalendarClock,
        label: "Expiry Reminders",
        description: "Pantry shelf life & waste alerts",
      },
    ];
  } else if (user?.accountType === "shop") {
    primaryLinks = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/my-listings", icon: Store, label: "Inventory" },
      { to: "/orders", icon: Package, label: "Orders" },
      { to: "/offers", icon: Tag, label: "Offers" },
    ];
    secondaryLinks = [
      {
        to: "/donations",
        icon: HeartHandshake,
        label: "Food Donations",
        description: "Donate surplus inventory to community",
      },
      {
        to: "/reminders",
        icon: CalendarClock,
        label: "Batch Reminders",
        description: "Monitor nearing-expiry items",
      },
    ];
  }

  const isMoreActive = secondaryLinks.some((item) => isLinkActive(item.to));

  return (
    <nav className="sticky top-0 z-50 bg-white/95 border-b border-gray-200 text-gray-900 shadow-sm dark:bg-[#090d16]/90 dark:border-gray-800/80 dark:shadow-black/30 dark:text-white backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link
            to={user?.isAdmin ? "/admin" : "/"}
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="relative w-10 h-10 rounded-2xl p-1 bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:border-emerald-400/60 transition-all duration-300 flex items-center justify-center shrink-0">
              <img
                src="/Images/fresh-produce-clock.png"
                alt="expireOFF"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight flex items-center select-none shrink-0 font-heading leading-none">
                <span className="text-gray-900 dark:text-white font-extrabold tracking-tight">
                  expire
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black ml-0.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.45)]">
                  OFF
                </span>
              </span>
              <span className="text-[9px] text-emerald-600/90 dark:text-emerald-400/80 mt-0.5 font-semibold tracking-wider uppercase">
                Zero Food Waste
              </span>
            </div>
          </Link>

          {/* Desktop Center: Major Navigation Links + More Toggle Menu */}
          <div className="hidden lg:flex items-center gap-1.5">
            {primaryLinks.map((link) => {
              const active = isLinkActive(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border shrink-0 ${
                    active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                      : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100 border-transparent hover:border-gray-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 dark:hover:border-gray-700/50"
                  }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 ${
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                  <span className="whitespace-nowrap">{link.label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </Link>
              );
            })}

            {/* "More" Toggle Dropdown for secondary links */}
            {secondaryLinks.length > 0 && (
              <div className="relative" ref={moreDropdownRef}>
                <button
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                    isMoreActive || showMoreDropdown
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                      : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100 border-transparent hover:border-gray-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 dark:hover:border-gray-700/50"
                  }`}
                  aria-expanded={showMoreDropdown}
                >
                  <span>More</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 text-gray-500 dark:text-gray-400 ${
                      showMoreDropdown ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                  {isMoreActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </button>

                {showMoreDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 text-gray-900 shadow-xl dark:bg-[#0c121e]/95 dark:border-gray-800/90 dark:text-gray-100 dark:shadow-2xl rounded-2xl p-2 z-50 backdrop-blur-2xl animate-dropdown">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 px-3 py-1.5">
                      Additional Tools
                    </div>
                    <div className="space-y-1">
                      {secondaryLinks.map((link) => {
                        const active = isLinkActive(link.to);
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setShowMoreDropdown(false)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 group border ${
                              active
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-white"
                                : "border-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-gray-800/60 dark:text-gray-300 dark:hover:text-white"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                active
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-400"
                                  : "bg-gray-100 border-gray-200 text-gray-500 group-hover:text-emerald-700 group-hover:border-emerald-300 group-hover:bg-emerald-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:group-hover:text-emerald-400 dark:group-hover:border-emerald-500/30 dark:group-hover:bg-emerald-500/10"
                              }`}
                            >
                              <Icon size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold leading-tight">
                                  {link.label}
                                </span>
                                {active && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 mt-0.5 leading-snug line-clamp-1">
                                {link.description}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Utilities: Location, Cart, Notifications & Profile */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl border transition-all cursor-pointer bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 dark:bg-gray-900/60 dark:hover:bg-gray-800 dark:border-gray-800/80 dark:text-gray-300 dark:hover:text-amber-400 shadow-sm"
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={16} className="text-gray-700 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Location Selector Pill — HIDDEN for Admin */}
            {!user?.isAdmin && (
              <div className="relative shrink-0" ref={locationDropdownRef}>
                <button
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  disabled={detecting}
                  className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-emerald-700 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer border border-gray-200 hover:border-emerald-300 font-medium shadow-sm group dark:text-gray-300 dark:bg-gray-900/60 dark:hover:bg-gray-800 dark:hover:text-emerald-400 dark:border-gray-800/80 dark:hover:border-emerald-500/30"
                  title="Click to change location"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  {detecting ? (
                    <Loader2
                      size={13}
                      className="animate-spin text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                  ) : (
                    <MapPin
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform"
                    />
                  )}
                  <span className="truncate max-w-[100px] xl:max-w-[130px] text-[11px] xl:text-xs">
                    {detecting ? "Detecting..." : locationText}
                  </span>
                  <ChevronDown
                    size={11}
                    className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 shrink-0 ${
                      showLocationPicker ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                </button>

                {showLocationPicker && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 text-gray-900 shadow-xl dark:bg-[#0c121e]/95 dark:border-gray-800/90 dark:text-gray-100 dark:shadow-2xl rounded-2xl p-2 z-50 backdrop-blur-2xl animate-dropdown">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 px-3 py-1">
                      Delivery Location
                    </div>
                    <div className="space-y-1 mt-1">
                      <button
                        onClick={() => {
                          detectLocation();
                          setShowLocationPicker(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-all group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 shrink-0">
                          <Crosshair size={14} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-xs">
                            Detect Automatically
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            Use GPS / WiFi position
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowManualPicker(true);
                          setShowLocationPicker(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-all group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-xs">
                            Select Manually
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            Choose from city list
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Icon Action Button — for household users */}
            {user?.accountType === "household" && (
              <Link
                to="/cart"
                className={`relative p-2 rounded-xl border transition-all duration-200 ${
                  isLinkActive("/cart")
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                    : "text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-gray-200 border-gray-200 dark:text-gray-300 dark:hover:text-emerald-400 dark:bg-gray-900/60 dark:hover:bg-gray-800 dark:border-gray-800/80"
                }`}
                title="View Shopping Cart"
              >
                <ShoppingCart size={17} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-gray-950 font-black text-[10px] flex items-center justify-center shadow-md shadow-emerald-500/40 ring-2 ring-white dark:ring-[#090d16]">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notification Bell with Dropdown Menu */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                  showNotifDropdown || isLinkActive("/notifications")
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                    : "text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-gray-200 border-gray-200 dark:text-gray-300 dark:hover:text-emerald-400 dark:bg-gray-900/60 dark:hover:bg-gray-800 dark:border-gray-800/80"
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shadow-md shadow-rose-500/40 ring-2 ring-white dark:ring-[#090d16] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 text-gray-900 shadow-2xl dark:bg-[#0e1422] dark:border-gray-800 dark:text-gray-100 rounded-2xl p-3 z-50 backdrop-blur-2xl animate-dropdown">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => dispatch(markAllNotificationsRead())}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id}
                          className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                            !n.isRead
                              ? "bg-emerald-50/60 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-500/30"
                              : "bg-gray-50/50 border-gray-100 hover:bg-gray-100/50 dark:bg-gray-900/40 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                              {n.title || (n.type === "order" ? "Order Alert" : "Notification")}
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            {!n.isRead ? (
                              <button
                                onClick={() => dispatch(markNotificationRead(n._id))}
                                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                              >
                                Mark as read
                              </button>
                            ) : (
                              <span />
                            )}
                            <button
                              onClick={() => {
                                if (!n.isRead) {
                                  dispatch(markNotificationRead(n._id));
                                }
                                setShowNotifDropdown(false);
                                const targetUrl =
                                  n.link ||
                                  (n.entityType === "order" && n.entityId
                                    ? `/orders?orderId=${n.entityId}`
                                    : n.entityType === "offer" && n.entityId
                                    ? `/offers?offerId=${n.entityId}`
                                    : "/orders");
                                navigate(targetUrl);
                              }}
                              className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              <span>View Now</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800/80 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View All Notifications</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown Pill */}
            <div
              className="relative ml-1 pl-2 border-l border-gray-200 dark:border-gray-800"
              ref={userDropdownRef}
            >
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 dark:bg-gray-900/60 dark:hover:bg-gray-800/80 dark:border-gray-800/80 dark:hover:border-gray-700 transition-all cursor-pointer group shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-emerald-500/20">
                  {getInitials(user.fullName)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-900 group-hover:text-emerald-700 dark:text-gray-200 dark:group-hover:text-white max-w-[85px] xl:max-w-[110px] truncate leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium capitalize leading-none">
                    {user?.isAdmin
                      ? "Admin"
                      : user?.accountType === "shop"
                      ? "Merchant"
                      : "Household"}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    showUserDropdown ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                />
              </button>

              {showUserDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 text-gray-900 shadow-xl dark:bg-[#0c121e]/95 dark:border-gray-800/90 dark:text-gray-100 dark:shadow-2xl rounded-2xl p-2 z-50 backdrop-blur-2xl animate-dropdown">
                  {/* User Profile Header Card */}
                  <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800/60 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                        {getInitials(user.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {user.fullName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {user.email ||
                            (user.accountType === "shop"
                              ? "Merchant Account"
                              : "Verified Account")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 dark:text-gray-400">Account Type</span>
                      <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider">
                        {user?.isAdmin ? "Administrator" : user?.accountType}
                      </span>
                    </div>
                  </div>

                  {/* Role-Specific Quick Links */}
                  <div className="space-y-0.5 py-1">
                    {user?.accountType === "household" && (
                      <>
                        <Link
                          to="/orders"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <Package size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/my-listings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <Store size={14} className="text-teal-600 dark:text-teal-400" />
                          <span>My Listings</span>
                        </Link>
                        <Link
                          to="/reminders"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <CalendarClock size={14} className="text-amber-500 dark:text-amber-400" />
                          <span>Expiry Reminders</span>
                        </Link>
                      </>
                    )}

                    {user?.accountType === "shop" && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <LayoutDashboard
                            size={14}
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                          <span>Store Dashboard</span>
                        </Link>
                        <Link
                          to="/my-listings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <Store size={14} className="text-teal-600 dark:text-teal-400" />
                          <span>Inventory & Listings</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <Package size={14} className="text-sky-600 dark:text-sky-400" />
                          <span>Customer Orders</span>
                        </Link>
                        <Link
                          to="/reminders"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                        >
                          <CalendarClock size={14} className="text-amber-500 dark:text-amber-400" />
                          <span>Batch Expiry Alerts</span>
                        </Link>
                      </>
                    )}

                    {user?.isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60 transition-all"
                      >
                        <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Admin Control Panel</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-800 space-y-1">
                    {/* Theme Toggle in User Profile Menu */}
                    <button
                      onClick={handleThemeToggle}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/60 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === "dark" ? (
                          <Sun size={14} className="text-amber-400" />
                        ) : (
                          <Moon size={14} className="text-gray-600 dark:text-gray-300" />
                        )}
                        <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {theme === "dark" ? "Dark" : "Light"}
                      </span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 rounded-xl transition-all cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Icons & Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Quick Cart on Mobile Header */}
            {user?.accountType === "household" && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-700 hover:text-emerald-700 rounded-xl bg-gray-100 border border-gray-200 dark:text-gray-300 dark:hover:text-emerald-400 dark:bg-gray-900/60 dark:border-gray-800"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-gray-950 font-black text-[9px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Theme Toggle on Mobile Header */}
            <button
              onClick={handleThemeToggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 text-gray-700 hover:text-emerald-700 rounded-xl bg-gray-100 border border-gray-200 dark:text-gray-300 dark:hover:text-emerald-400 dark:bg-gray-900/60 dark:border-gray-800 transition-all cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Quick Notifications on Mobile Header */}
            <Link
              to="/notifications"
              className="relative p-2 text-gray-700 hover:text-emerald-700 rounded-xl bg-gray-100 border border-gray-200 dark:text-gray-300 dark:hover:text-emerald-400 dark:bg-gray-900/60 dark:border-gray-800"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 dark:text-gray-400 dark:hover:text-white dark:bg-gray-800/60 dark:border-gray-800/80 transition-all cursor-pointer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE NAVIGATION DRAWER ==================== */}
      {mobileOpen && (
        <div className="lg:hidden bg-white/98 border-t border-gray-200 text-gray-900 dark:bg-[#0c121e]/98 dark:border-gray-800 dark:text-white px-4 py-4 space-y-3 backdrop-blur-2xl animate-dropdown max-h-[85vh] overflow-y-auto">
          {/* Theme Toggle row in mobile */}
          <button
            onClick={handleThemeToggle}
            className="flex items-center justify-between w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-700" />}
              <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          {/* User Profile Card on Mobile */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {user.fullName}
                </p>
                <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
                  {user?.isAdmin ? "Admin" : user?.accountType}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {user.email || "Active User"}
              </p>
            </div>
          </div>

          {/* Location button on mobile */}
          {!user?.isAdmin && (
            <button
              onClick={() => {
                detectLocation();
                setMobileOpen(false);
              }}
              disabled={detecting}
              className="flex items-center justify-between w-full text-left text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-2">
                {detecting ? (
                  <Loader2
                    size={16}
                    className="animate-spin text-emerald-600 dark:text-emerald-400"
                  />
                ) : (
                  <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" />
                )}
                <span>{detecting ? "Detecting location..." : locationText}</span>
              </div>
              <ChevronRight size={14} className="text-gray-400 dark:text-gray-500" />
            </button>
          )}

          {/* Major Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 px-1 pt-1">
              Main Menu
            </div>
            {primaryLinks.map((link) => {
              const active = isLinkActive(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold"
                      : "border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{link.label}</span>
                  </div>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Secondary / More Tools Links */}
          {secondaryLinks.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800/60">
              <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 px-1">
                More Tools & Services
              </div>
              {secondaryLinks.map((link) => {
                const active = isLinkActive(link.to);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold"
                        : "border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{link.label}</span>
                    </div>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Logout Section */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
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
