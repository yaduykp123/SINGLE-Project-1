import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { isValidEmail, getEmailError, isValidPhone, getPhoneError, getNameError } from "../utils/validation";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    adminSecret: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phone") {
      let clean = value.replace(/[^\d+]/g, "");
      if (clean.indexOf("+") > 0) {
        clean = clean.replace(/\+/g, "");
      }
      const maxLimit = clean.startsWith("+91") ? 13 : 10;
      processedValue = clean.slice(0, maxLimit);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (name === "fullName") {
        const err = getNameError(value);
        if (err) newErrors.fullName = err;
        else delete newErrors.fullName;
      } else if (name === "email") {
        const err = getEmailError(value);
        if (err) newErrors.email = err;
        else delete newErrors.email;
      } else if (name === "phone") {
        const err = getPhoneError(value);
        if (err) newErrors.phone = err;
        else delete newErrors.phone;
      } else if (name === "password" && value.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else if (name === "confirmPassword" && value !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match";
      } else if (name === "adminSecret" && !value.trim()) {
        newErrors.adminSecret = "Admin secret key is required";
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const nameErr = getNameError(formData.fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const emailErr = getEmailError(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = getPhoneError(formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.adminSecret.trim()) {
      newErrors.adminSecret = "Admin secret key is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const { data } = await axiosInstance.post("/admin/register-admin", registerData);
      
      toast.success("Admin account created successfully!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect to admin dashboard
      navigate("/admin");
    } catch (error) {
      const msg = error.response?.data?.message || "Admin registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 px-4 flex items-center justify-center bg-[#f8faf9] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 relative overflow-y-auto selection:bg-amber-500 selection:text-white transition-colors">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 w-full max-w-md my-auto relative z-10">
        <div className="text-center mb-3">
          <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Shield size={24} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Registration</h1>
          <p className="text-gray-400 text-xs mt-0.5">Create an administrator account</p>
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
                className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                  errors.fullName ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-amber-500 focus:ring-amber-500/20"
                }`}
                placeholder="John Doe"
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
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.email ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  placeholder="admin@example.com"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Phone (10 digits)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  maxLength={formData.phone.startsWith("+") ? 13 : 10}
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.phone ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  placeholder="9876543210"
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
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
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 pr-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.password ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  placeholder="••••••••"
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
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                    errors.confirmPassword ? "border-red-500 focus:ring-red-500/50" : "border-gray-800 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="border-t border-gray-800/80 pt-2.5">
            <label className="block text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Admin Secret Key
            </label>
            <div className="relative">
              <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
              <input
                type="password"
                name="adminSecret"
                value={formData.adminSecret}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2 bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all ${
                  errors.adminSecret ? "border-red-500 focus:ring-red-500/50" : "border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20"
                }`}
                placeholder="Enter secret key"
              />
            </div>
            {errors.adminSecret ? (
              <p className="text-[11px] text-red-400 mt-1">{errors.adminSecret}</p>
            ) : (
              <p className="text-[10px] text-amber-400/80 mt-1">
                Required to create an admin account. Contact super admin for the key.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20 border border-amber-400/25 disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? "Creating Admin Account..." : "Register as Admin"}
          </button>
        </form>

        <p className="text-center mt-3 text-xs text-gray-400 border-t border-gray-800/80 pt-3">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;
