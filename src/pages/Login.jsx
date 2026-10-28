import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/thunks/authThunks";
import { Mail, Lock, Eye, EyeOff, Leaf, Ban } from "lucide-react";
import { isValidEmail, getEmailError } from "../utils/validation";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (name === "email") {
        const err = getEmailError(value.trim());
        if (err) newErrors.email = err;
        else delete newErrors.email;
      } else if (name === "password" && !value) {
        newErrors.password = "Password is required";
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const emailErr = getEmailError(formData.email.trim());
    if (emailErr) newErrors.email = emailErr;

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please enter valid credentials");
      return;
    }

    dispatch(loginUser({ email: formData.email.trim(), password: formData.password }, navigate));
  };

  return (
    <div className="min-h-screen py-6 px-4 flex items-center justify-center bg-[#f8faf9] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 relative overflow-y-auto selection:bg-emerald-500 selection:text-white transition-colors">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 w-full max-w-sm my-auto relative z-10">
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center">
            <img 
              src="/Images/fresh-produce-clock.png" 
              alt="expireOFF" 
              className="w-full h-full object-contain filter drop-shadow" 
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Login to your expireOff account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 text-xs sm:text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all ${
                  errors.email ? "border-red-500 focus:ring-red-500/50" : "border-gray-300 dark:border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950/50 border rounded-xl focus:outline-none focus:ring-2 pl-9 pr-10 text-xs sm:text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all ${
                  errors.password ? "border-red-500 focus:ring-red-500/50" : "border-gray-300 dark:border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800/80 pt-3">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
