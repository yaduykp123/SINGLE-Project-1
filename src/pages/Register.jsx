import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../redux/thunks/authThunks";
import { User, Mail, Ban, Phone, Lock, Eye, EyeOff, Store, Home, Shield, Leaf } from "lucide-react";
import toast from "react-hot-toast";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone?.replace(/\s/g, ""));

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "household",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    setErrors(prev => {
      if (!prev[name]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    setErrors(prev => {
      const newErrors = { ...prev };

      if (name === "fullName" && (!value || value.length < 2)) {
        newErrors.fullName = "Name must be at least 2 characters";
      } else if (name === "email" && !isValidEmail(value)) {
        newErrors.email = "Please enter a valid email";
      } else if (name === "phone" && !isValidPhone(value)) {
        newErrors.phone = "Enter valid 10-digit mobile number";
      } else if (name === "password" && value.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else if (name === "confirmPassword" && value !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        delete newErrors[name];
      }

      return newErrors;
    });
  }, [formData.password]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors");
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    dispatch(registerUser(registerData, navigate));
  }, [formData, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-gray-100 p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">

            <svg width="0" height="0" className="absolute">
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
         <stop offset="0%" stopColor="#d5d3d2ff" /> {/* Pink */}
          <stop offset="33%" stopColor="#c06437ff" /> {/* Purple */}
          <stop offset="66%" stopColor="#adec10ff" /> {/* Blue */}
          <stop offset="100%" stopColor="#1be9b9ff" /> {/* Emerald */}
        </linearGradient>

        <linearGradient id="rainbow-gradients" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#50de34ff" /> {/* Pink */}
          <stop offset="33%" stopColor="#48d52fff" /> {/* Purple */}
          <stop offset="66%" stopColor="#5f864dff" /> {/* Blue */}
          <stop offset="100%" stopColor="#11e69fff" /> {/* Emerald */}
        </linearGradient>

      </svg>
            <Ban size={40} strokeWidth={2.5} style={{ stroke: "url(#rainbow-gradient)" }} > <Leaf size={23} strokeWidth={1.3} style={{ stroke: "url(#rainbow-gradients)" }}></Leaf></Ban>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join expireOff and prevent food waste</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                autoComplete="off"
                className={`w-full px-4 py-3 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-11 text-gray-200 placeholder-gray-500 transition-all ${
                  errors.fullName ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
            </div>
            {errors.fullName && <p className="text-xs text-red-400 mt-1.5">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                autoComplete="off"
                className={`w-full px-4 py-3 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-11 text-gray-200 placeholder-gray-500 transition-all ${
                  errors.email ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Phone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="9876543210"
                autoComplete="off"
                className={`w-full px-4 py-3 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-11 text-gray-200 placeholder-gray-500 transition-all ${
                  errors.phone ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400 mt-1.5">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, accountType: "household" }))}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  formData.accountType === "household"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5"
                    : "border-gray-800 bg-gray-950/30 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                }`}
              >
                <Home size={18} />
                <span className="font-medium text-sm">Household</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, accountType: "shop" }))}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  formData.accountType === "shop"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5"
                    : "border-gray-800 bg-gray-950/30 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                }`}
              >
                <Store size={18} />
                <span className="font-medium text-sm">Shop</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-11 pr-12 text-gray-200 placeholder-gray-500 transition-all ${
                  errors.password ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-11 pr-12 text-gray-200 placeholder-gray-500 transition-all ${
                  errors.confirmPassword ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center border-t border-gray-800/80 pt-6">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
              Login here
            </Link>
          </p>
          <p className="text-sm">
            <Link to="/admin-register" className="text-gray-400 hover:text-emerald-400 font-medium transition-colors inline-flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-500" />
              Register as Administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;