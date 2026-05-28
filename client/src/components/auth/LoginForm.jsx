import { useState } from "react";
import { useDispatch } from "react-redux";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginUser } from "../../redux/user/userSlice";
import { toast } from "react-toastify";

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

export default function LoginForm({ onToggle, onNavigate, isVisible }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resultAction = await dispatch(loginUser(loginData));

      if (loginUser.fulfilled.match(resultAction)) {
        const data = resultAction.payload;
        localStorage.setItem("token", data.token || data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        toast.success(`Welcome back, ${data.user.firstName}!`);
        onNavigate("dashboard");
      } else {
        setError(resultAction.payload || "Failed to log in");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLoginSubmit}
      className={`auth-form flex flex-col items-center justify-center gap-3.5 p-16 col-start-1 col-end-2 row-start-1 row-end-2 w-full max-w-lg mx-auto rounded-[1.8rem] border border-slate-100/50 bg-white/90 shadow-2xl backdrop-blur-md max-lg:bg-white max-lg:shadow-xl max-lg:border-slate-100 max-lg:p-10 max-sm:p-6 max-sm:gap-3
        ${isVisible 
          ? "z-[5] opacity-100 pointer-events-auto translate-x-0 transition-all duration-[400ms] delay-[800ms] ease-in-out max-lg:transition-none" 
          : "z-[1] opacity-0 pointer-events-none -translate-x-[80px] max-lg:translate-x-0"
        }
      `}
    >
      <div className="auth-brand-row flex items-center gap-3 mb-1">
        <img src="/kumori_mascot.png" alt="Kumori" className="auth-brand-mascot w-[3.2rem] h-[3.2rem] object-contain" />
        <span className="auth-brand-name text-[1.85rem] font-extrabold text-[#2a2e33] tracking-tight">Kumori</span>
      </div>

      <h2 className="auth-title text-2xl font-bold text-[#2a2e33] m-0">Welcome back</h2>
      <p className="auth-subtitle text-[14px] text-slate-500 text-center m-0 mb-2">Access your secure cloud file storage</p>

      {error && <div className="auth-error-banner w-full rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-[#c62828] text-center">{error}</div>}

      <AuthField id="login-email" label="Email Address" icon={Mail}>
        <input
          id="login-email"
          type="email"
          required
          placeholder="name@company.com"
          value={loginData.email}
          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
        />
      </AuthField>

      <AuthField id="login-password" label="Password" icon={Lock}>
        <input
          id="login-password"
          type={showLoginPassword ? "text" : "password"}
          required
          placeholder="••••••••"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
        />
        <button
          type="button"
          onClick={() => setShowLoginPassword((value) => !value)}
          className="auth-icon-button border-none bg-transparent text-slate-400 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-200 hover:text-[#2a2e33] hover:bg-slate-100"
          aria-label={showLoginPassword ? "Hide password" : "Show password"}
        >
          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </AuthField>

      <button 
        type="submit" 
        disabled={loading} 
        className="auth-btn w-full max-w-[16rem] h-12 rounded-full border-none font-bold uppercase tracking-wider text-[13px] cursor-pointer transition-all duration-200 disabled:opacity-65 disabled:cursor-not-allowed mt-2 text-white bg-gradient-to-r from-[#b71c1c] to-[#c62828] shadow-[0_8px_20px_rgba(198,40,40,0.22)] inline-flex items-center justify-center gap-2 hover:shadow-[0_12px_24px_rgba(198,40,40,0.3)] hover:-translate-y-[1px] active:translate-y-[1px]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Log in"
        )}
      </button>

      <p className="auth-inline-note text-sm text-slate-500 text-center mt-2 m-0">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onToggle} className="auth-inline-link border-none bg-transparent text-[#c62828] font-bold cursor-pointer hover:text-[#b71c1c]">
          Sign up free
        </button>
      </p>
    </form>
  );
}
