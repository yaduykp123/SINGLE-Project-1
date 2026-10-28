import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, resendResetOTP } from "../redux/thunks/authThunks";
import { Lock, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { resetEmail, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!resetEmail) {
      navigate("/forgot-password");
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resetEmail, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;          //digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResend = () => {
    dispatch(resendResetOTP(resetEmail));
    setTimer(60);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setFormError("Please enter the full 6-digit code");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setFormError("");
    dispatch(resetPassword({ email: resetEmail, otp: otpValue, newPassword }, navigate));
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <Shield size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reset Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter the 6-digit code sent to{" "}
            <span className="text-gray-700 dark:text-gray-300 font-medium">{resetEmail}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 sm:w-12 h-14 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-950/40 border border-gray-300 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm dark:shadow-inner"
              />
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950/50 border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 pl-11 pr-12 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950/50 border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 pl-11 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-red-500 dark:text-red-400 text-center">{formError}</p>}

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="text-center pt-1">
            {timer > 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resend code in <span className="font-semibold text-emerald-600 dark:text-emerald-400">{timer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Resend Code
              </button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800/80 pt-5">
            <Link
              to="/login"
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;