import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { User, Mail, Phone, Lock, Eye, EyeOff, Shield } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!formData.adminSecret.trim()) {
      toast.error("Admin secret key is required");
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
    <div className="min-h-screen py-6 px-4 flex items-center justify-center bg-[#0b0f19] text-gray-100 relative overflow-y-auto selection:bg-amber-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-5 w-full max-w-md my-auto relative z-10">
        <div className="text-center mb-3">
          <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Shield size={24} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Registration</h1>
          <p className="text-gray-400 text-xs mt-0.5">Create an administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all"
                placeholder="John Doe"
              />
            </div>
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
                  required
                  className="w-full px-3.5 py-2 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all"
                  placeholder="admin@example.com"
                />
              </div>
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
                  required
                  className="w-full px-3.5 py-2 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all"
                  placeholder="9876543210"
                />
              </div>
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
                  required
                  className="w-full px-3.5 py-2 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pl-9 pr-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all"
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
                  required
                  className="w-full px-3.5 py-2 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
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
                required
                className="w-full px-3.5 py-2 bg-gray-950/50 border border-amber-500/30 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pl-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 transition-all"
                placeholder="Enter secret key"
              />
            </div>
            <p className="text-[10px] text-amber-400/80 mt-1">
              Required to create an admin account. Contact super admin for the key.
            </p>
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
