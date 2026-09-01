import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../redux/thunks/authThunks";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    dispatch(forgotPassword(email, navigate));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-gray-100 p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <KeyRound size={26} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Forgot Password?</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter your email and we'll send you a 6-digit code to reset it
          </p>
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
                autoFocus
                className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 pl-11 text-gray-200 placeholder-gray-500 transition-all"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 disabled:opacity-50 mt-2"
          >
            {loading ? "Sending code..." : "Send Reset Code"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400 border-t border-gray-800/80 pt-6">
          <Link
            to="/login"
            className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;