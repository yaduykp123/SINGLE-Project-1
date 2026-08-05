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
    <div className="min-h-screen py-6 px-4 flex items-center justify-center bg-[#0b0f19] text-gray-100 relative overflow-y-auto selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-5 w-full max-w-md my-auto relative z-10">
        <div className="text-center mb-3">
          <div className="w-16 h-11 mx-auto">
            <img 
              src="/Images/LOGO_ExpireOFF-generated.png" 
              alt="expireOFF Icon" 
              className="w-full h-full object-contain shrink-0" 
            />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-xs mt-0.5">Join expireOff and prevent food waste</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                autoComplete="off"
                className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                  errors.fullName ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-red-400 mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  autoComplete="off"
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.email ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="9876543210"
                  autoComplete="off"
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.phone ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, accountType: "household" }))}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  formData.accountType === "household"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 font-semibold"
                    : "border-gray-800 bg-gray-950/30 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                }`}
              >
                <Home size={15} />
                <span className="text-xs">Household</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, accountType: "shop" }))}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  formData.accountType === "shop"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 font-semibold"
                    : "border-gray-800 bg-gray-950/30 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                }`}
              >
                <Store size={15} />
                <span className="text-xs">Shop</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 pr-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.password ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 pr-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.confirmPassword ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-3 space-y-1 text-center border-t border-gray-800/80 pt-3">
          <p className="text-xs text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              Login here
            </Link>
          </p>
          <p className="text-xs">
            <Link to="/admin-register" className="text-gray-400 hover:text-emerald-400 font-semibold transition-colors inline-flex items-center gap-1">
              <Shield size={13} className="text-emerald-500" />
              Register as Administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
