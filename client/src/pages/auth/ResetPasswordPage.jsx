import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios";

const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|<>]/;

function AuthField({ id, label, icon: Icon, children }) {
  return (
    <div className="auth-field w-full">
      <label htmlFor={id} className="auth-field-label inline-block mb-1.5 ml-1 text-[11px] font-bold text-slate-500 tracking-widest uppercase">
        {label}
      </label>
      <div className="auth-input-field w-full h-[3.2rem] rounded-full grid grid-cols-[2.75rem_1fr_auto] items-center border-[1.5px] border-[#f1f3f5] bg-[#f1f3f5] pr-3 transition-all duration-250 ease-out focus-within:border-[#c62828] focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(198,40,40,0.08)]">
        <div className="auth-input-icon justify-self-center text-slate-400" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ResetPasswordPage({ onNavigate }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleNavigateToLogin = () => {
    if (onNavigate) {
      onNavigate("login");
    } else {
      navigate("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing from the URL. Please request a new link.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!SPECIAL_CHAR_PATTERN.test(newPassword)) {
      setError("Password must include at least one special character.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/api/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });

      setSuccess(response.data?.message || "Password reset successfully!");
      toast.success("Password reset successfully! Redirecting to login...");
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        handleNavigateToLogin();
      }, 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to reset password. The link may have expired.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#f5f7fa] to-[#ffffff] flex items-center justify-center p-10 max-sm:p-4">
      {/* Main card wrapper */}
      <div className="relative w-full max-w-lg mx-auto z-[8]">
        <form
          onSubmit={handleSubmit}
          className="auth-form flex flex-col items-center justify-center gap-3.5 p-16 w-full rounded-[1.8rem] border border-slate-100/50 bg-white/90 shadow-2xl backdrop-blur-md max-lg:bg-white max-lg:shadow-xl max-lg:border-slate-100 max-lg:p-10 max-sm:p-6 max-sm:gap-3"
        >
          <div className="auth-brand-row flex items-center gap-3 mb-1">
            <img src="/kumori_mascot.png" alt="Kumori" className="auth-brand-mascot w-[3.2rem] h-[3.2rem] object-contain" />
            <span className="auth-brand-name text-[1.85rem] font-extrabold text-[#2a2e33] tracking-tight">Kumori</span>
          </div>

          <h2 className="auth-title text-2xl font-bold text-[#2a2e33] m-0 text-center">Reset Password</h2>
          <p className="auth-subtitle text-[14px] text-slate-500 text-center m-0 mb-2">Create a secure new password for your account</p>

          {!token && (
            <div className="auth-error-banner w-full rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-[#c62828] text-center">
              Reset token is missing. Please make sure you clicked the correct link from your email or request a new one.
            </div>
          )}

          {error && <div className="auth-error-banner w-full rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-[#c62828] text-center">{error}</div>}
          {success && <div className="auth-success-banner w-full rounded-xl border border-green-200 bg-green-50 p-2.5 text-xs font-semibold text-emerald-700 text-center">{success}</div>}

          <AuthField id="new-password" label="New Password" icon={Lock}>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              required
              disabled={!token}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={!token}
              onClick={() => setShowPassword((value) => !value)}
              className="auth-icon-button border-none bg-transparent text-slate-400 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-200 hover:text-[#2a2e33] hover:bg-slate-100 disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>

          <AuthField id="confirm-password" label="Confirm Password" icon={Lock}>
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
              disabled={!token}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={!token}
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="auth-icon-button border-none bg-transparent text-slate-400 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-200 hover:text-[#2a2e33] hover:bg-slate-100 disabled:opacity-50"
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>

          <button 
            type="submit" 
            disabled={loading || !token || !!success} 
            className="auth-btn w-full max-w-[16rem] h-12 rounded-full border-none font-bold uppercase tracking-wider text-[13px] cursor-pointer transition-all duration-200 disabled:opacity-65 disabled:cursor-not-allowed mt-2 text-white bg-gradient-to-r from-[#b71c1c] to-[#c62828] shadow-[0_8px_20px_rgba(198,40,40,0.22)] inline-flex items-center justify-center gap-2 hover:shadow-[0_12px_24px_rgba(198,40,40,0.3)] hover:-translate-y-[1px] active:translate-y-[1px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "RESET PASSWORD"
            )}
          </button>

          <p className="auth-inline-note text-sm text-slate-500 text-center mt-2 m-0">
            <button 
              type="button" 
              onClick={handleNavigateToLogin} 
              className="auth-inline-link border-none bg-transparent text-[#c62828] font-bold cursor-pointer hover:text-[#b71c1c] inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Back to log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
