import { useState } from "react";
import { useDispatch } from "react-redux";
import { User, Mail, Calendar, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { registerUser } from "../../redux/user/userSlice";
import { toast } from "react-toastify";

const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|<>]/;

function AuthField({ id, label, icon: Icon, children, className = "" }) {
  return (
    <div className={`auth-field w-full ${className}`}>
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

export default function RegisterForm({ onToggle, onNavigate, isVisible }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (
      !registerData.firstName ||
      !registerData.lastName ||
      !registerData.email ||
      !registerData.dateOfBirth ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!SPECIAL_CHAR_PATTERN.test(registerData.password)) {
      setError("Password must include at least one special character.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resultAction = await dispatch(
        registerUser({
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          password: registerData.password,
          confirmPassword: registerData.confirmPassword,
          dateOfBirth: registerData.dateOfBirth,
        }),
      );

      if (registerUser.fulfilled.match(resultAction)) {
        const data = resultAction.payload;

        if (data?.token || data?.accessToken) {
          localStorage.setItem("token", data.token || data.accessToken);
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        toast.success("Registration successful! Please log in.");
        onToggle(); // Switches to Sign In view
        setError("");
      } else {
        setError(resultAction.payload || "Failed to create account");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegisterSubmit}
      className={`auth-form flex flex-col items-center justify-center gap-3.5 p-16 col-start-1 col-end-2 row-start-1 row-end-2 w-full max-w-lg mx-auto rounded-[1.8rem] border border-slate-100/50 bg-white/90 shadow-2xl backdrop-blur-md max-lg:bg-white max-lg:shadow-xl max-lg:border-slate-100 max-lg:p-10 max-sm:p-6 max-sm:gap-3
        ${isVisible 
          ? "z-[5] opacity-100 pointer-events-auto translate-x-0 transition-all duration-[400ms] delay-[800ms] ease-in-out max-lg:transition-none" 
          : "z-[1] opacity-0 pointer-events-none translate-x-[80px] transition-all duration-[400ms] ease-in-out max-lg:translate-x-0"
        }
      `}
    >
      <div className="auth-sign-up-grid grid grid-cols-2 gap-x-3 gap-y-2 max-h-[min(82vh,52rem)] overflow-y-auto pr-1 w-full max-lg:overflow-visible max-lg:max-h-none max-sm:grid-cols-1">
        <div className="auth-brand-row col-span-2 flex items-center gap-3 mb-1 justify-center max-sm:col-span-1">
          <img src="/kumori_mascot.png" alt="Kumori" className="auth-brand-mascot w-[3.2rem] h-[3.2rem] object-contain" />
          <span className="auth-brand-name text-[1.85rem] font-extrabold text-[#2a2e33] tracking-tight">Kumori</span>
        </div>

        <h2 className="auth-title col-span-2 text-2xl font-bold text-[#2a2e33] m-0 text-center max-sm:col-span-1">Create your account</h2>
        <p className="auth-subtitle col-span-2 text-[14px] text-slate-500 text-center m-0 mb-2 max-sm:col-span-1">Start sharing and managing your files intelligently</p>

        {error && <div className="auth-error-banner col-span-2 w-full rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-[#c62828] text-center max-sm:col-span-1">{error}</div>}

        <AuthField id="first-name" label="First Name" icon={User} className="col-span-1 max-sm:col-span-1">
          <input
            id="first-name"
            type="text"
            required
            placeholder="John"
            value={registerData.firstName}
            onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
            className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
          />
        </AuthField>

        <AuthField id="last-name" label="Last Name" icon={User} className="col-span-1 max-sm:col-span-1">
          <input
            id="last-name"
            type="text"
            required
            placeholder="Doe"
            value={registerData.lastName}
            onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
            className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
          />
        </AuthField>

        <AuthField id="register-email" label="Email Address" icon={Mail} className="col-span-2 max-sm:col-span-1">
          <input
            id="register-email"
            type="email"
            required
            placeholder="name@company.com"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
          />
        </AuthField>

        <AuthField id="dob" label="Date of Birth" icon={Calendar} className="col-span-2 max-sm:col-span-1">
          <input
            id="dob"
            type="date"
            required
            value={registerData.dateOfBirth}
            onChange={(e) => setRegisterData({ ...registerData, dateOfBirth: e.target.value })}
            className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
          />
        </AuthField>

        <AuthField id="register-password" label="Password" icon={Lock} className="col-span-1 max-sm:col-span-1">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="auth-icon-button border-none bg-transparent text-slate-400 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-200 hover:text-[#2a2e33] hover:bg-slate-100"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </AuthField>

        <AuthField id="confirm-password" label="Confirm Password" icon={Lock} className="col-span-1 max-sm:col-span-1">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={registerData.confirmPassword}
            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
            className="w-full border-none bg-transparent outline-hidden text-[#2a2e33] text-[15px] font-medium placeholder-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="auth-icon-button border-none bg-transparent text-slate-400 w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-200 hover:text-[#2a2e33] hover:bg-slate-100"
            aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </AuthField>

        <div className="col-span-2 flex flex-col items-center mt-2 max-sm:col-span-1">
          <button 
            type="submit" 
            disabled={loading} 
            className="auth-btn w-full max-w-[16rem] h-12 rounded-full border-none font-bold uppercase tracking-wider text-[13px] cursor-pointer transition-all duration-200 disabled:opacity-65 disabled:cursor-not-allowed text-white bg-gradient-to-r from-[#b71c1c] to-[#c62828] shadow-[0_8px_20px_rgba(198,40,40,0.22)] inline-flex items-center justify-center gap-2 hover:shadow-[0_12px_24px_rgba(198,40,40,0.3)] hover:-translate-y-[1px] active:translate-y-[1px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="auth-inline-note text-sm text-slate-500 text-center mt-3.5 m-0">
            Already have an account?{" "}
            <button type="button" onClick={onToggle} className="auth-inline-link border-none bg-transparent text-[#c62828] font-bold cursor-pointer hover:text-[#b71c1c]">
              Log in
            </button>
          </p>
        </div>
      </div>
    </form>
  );
}
