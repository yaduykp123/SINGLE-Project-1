import { Routes, Route , useLocation} from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth, updateUserLocation as updateLocationThunk } from "./redux/thunks/authThunks";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ LAZY LOAD all pages — only download when needed
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Products = lazy(() => import("./pages/Products"));
const MyListings = lazy(() => import("./pages/MyListings"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminRegister = lazy(() => import("./pages/AdminRegister"));
const Offers = lazy(() => import("./pages/Offers"));
const Notifications = lazy(() => import("./pages/Notifications"));

// ✅ Lightweight loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // ✅ Auto-detect location if missing on login/app load
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      !user.isAdmin &&
      (user.latitude === null || user.longitude === null) &&
      !sessionStorage.getItem("locationAutoPrompted")
    ) {
      sessionStorage.setItem("locationAutoPrompted", "true");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              const data = await res.json();
              const address = data.address || {};
              dispatch(
                updateLocationThunk({
                  latitude,
                  longitude,
                  city: address.city || address.town || address.village || "",
                  state: address.state || "",
                  country: address.country || "",
                })
              );
            } catch (error) {
              dispatch(
                updateLocationThunk({ latitude, longitude, city: "", state: "", country: "" })
              );
            }
          },
          (error) => {
            console.log("Auto-detection of location failed or denied permission:", error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [isAuthenticated, user, dispatch]);

  // ✅ Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin-register" element={<AdminRegister />} />

          {/* Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedTypes={["household"]}>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offers"
            element={
              <ProtectedRoute>
                <Offers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <ProtectedRoute allowedTypes={["household"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedTypes={["shop"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
