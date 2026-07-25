import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/thunks/authThunks";
import { Mail, Lock, Eye, EyeOff, Leaf, Ban } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData, navigate));
  };

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-1">Login to your expireOff account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 pl-11 text-gray-200 placeholder-gray-500 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 pl-11 pr-12 text-gray-200 placeholder-gray-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 disabled:opacity-50 mt-2"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400 border-t border-gray-800/80 pt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;