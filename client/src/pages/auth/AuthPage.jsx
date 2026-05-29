import { useEffect, useState } from "react";
import LoginForm from "../../components/auth/LoginForm";
import RegisterForm from "../../components/auth/RegisterForm";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

function AuthPanelArt({ variant, isSignUpMode }) {
  const commonClasses = "w-full max-w-[35rem] transition-transform duration-[1100ms] delay-[400ms] ease-in-out object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.25)]";
  
  if (variant === "left") {
    return (
      <img
        src="/kumori_package.png"
        alt="Kumori Package"
        className={`${commonClasses} ${isSignUpMode ? "-translate-x-[800px]" : "translate-x-0"}`}
      />
    );
  }

  return (
    <img
      src="/kumoir_laptop.png"
      alt="Kumori Dashboard Preview"
      className={`${commonClasses} ${isSignUpMode ? "translate-x-0" : "translate-x-[800px]"}`}
    />
  );
}

export default function AuthPage({ onNavigate, initialMode = "login" }) {
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === "register");
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [useDelay, setUseDelay] = useState(true);

  useEffect(() => {
    setIsSignUpMode(initialMode === "register");
    setIsForgotPasswordMode(false);
    setUseDelay(true);
  }, [initialMode]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#f5f7fa] to-[#ffffff] lg:block flex max-lg:flex max-lg:items-center max-lg:justify-center max-lg:p-10 max-lg:overflow-y-auto max-sm:p-4">
      
      {/* Sliding background circle - Aesthetic Red Gradient */}
      <div 
        className={`absolute w-[1800px] h-[1800px] rounded-full bg-gradient-to-br from-[#9e1b1b] to-[#dc2626] transition-all duration-[1800ms] ease-in-out z-[6] -translate-y-1/2 max-lg:hidden
          ${isSignUpMode ? "translate-x-full right-[52%]" : "right-[48%]"}
        `}
      />

      <div className="auth-forms-container absolute inset-0 max-lg:relative max-lg:w-full max-lg:max-w-lg max-lg:mx-auto">
        <div 
          className={`auth-signin-signup absolute top-1/2 w-1/2 -translate-y-1/2 transition-all duration-[1000ms] delay-[700ms] ease-in-out grid grid-cols-1 z-[8] max-lg:relative max-lg:top-auto max-lg:left-auto max-lg:w-full max-lg:translate-x-0 max-lg:translate-y-0 max-lg:transition-none
            ${isSignUpMode ? "left-[25%] -translate-x-1/2" : "left-[75%] -translate-x-1/2"}
          `}
        >
          <LoginForm 
            isVisible={!isSignUpMode && !isForgotPasswordMode} 
            onToggle={() => {
              setIsSignUpMode(true);
              setIsForgotPasswordMode(false);
              setUseDelay(true);
            }} 
            onNavigate={onNavigate} 
            onForgotPasswordClick={() => {
              setIsForgotPasswordMode(true);
              setUseDelay(false);
            }}
            useDelay={useDelay}
          />
          <RegisterForm 
            isVisible={isSignUpMode && !isForgotPasswordMode} 
            onToggle={() => {
              setIsSignUpMode(false);
              setIsForgotPasswordMode(false);
              setUseDelay(true);
            }} 
            onNavigate={onNavigate} 
          />
          <ForgotPasswordForm
            isVisible={isForgotPasswordMode}
            onBackToLogin={() => {
              setIsForgotPasswordMode(false);
              setUseDelay(false);
            }}
          />
        </div>
      </div>

      {/* Sliding overlay text and mockups */}
      <div className="auth-panels-container absolute inset-0 grid grid-cols-2 max-lg:hidden" aria-hidden="true">
        
        {/* Left Panel (Visible during Login view) */}
        <div className={`auth-panel flex flex-col justify-around items-end text-center z-[7] pr-[17%] pl-[12%] py-12 transition-all duration-200
          ${isSignUpMode ? "pointer-events-none" : "pointer-events-auto"}
        `}>
          <div className={`auth-panel-content text-white transition-transform duration-[900ms] delay-[600ms] ease-in-out ${isSignUpMode ? "-translate-x-[800px]" : "translate-x-0"}`}>
            <h3 className="m-0 text-xl font-bold leading-tight">New here?</h3>
            <p className="mt-3.5 mb-4 text-[14px] leading-relaxed max-w-[20rem]">Create an account and start managing your cloud files with us today.</p>
            <button 
              type="button" 
              className="w-[8.2rem] h-[2.6rem] border-2 border-white bg-transparent text-white font-bold uppercase tracking-wider text-[11px] rounded-full hover:bg-white/10 active:scale-95 cursor-pointer transition-all duration-200 block mx-auto" 
              onClick={() => {
                setIsSignUpMode(true);
                setIsForgotPasswordMode(false);
                setUseDelay(true);
              }}
            >
              Sign up
            </button>
          </div>
          <AuthPanelArt variant="left" isSignUpMode={isSignUpMode} />
        </div>

        {/* Right Panel (Visible during Sign Up view) */}
        <div className={`auth-panel flex flex-col justify-around items-end text-center z-[7] pr-[12%] pl-[17%] py-12 transition-all duration-200
          ${isSignUpMode ? "pointer-events-auto" : "pointer-events-none"}
        `}>
          <div className={`auth-panel-content text-white transition-transform duration-[900ms] delay-[600ms] ease-in-out ${isSignUpMode ? "translate-x-0" : "translate-x-[800px]"}`}>
            <h3 className="m-0 text-xl font-bold leading-tight">One of us?</h3>
            <p className="mt-3.5 mb-4 text-[14px] leading-relaxed max-w-[20rem]">Sign in to continue your cloud file sharing experience and access your dashboard.</p>
            <button 
              type="button" 
              className="w-[8.2rem] h-[2.6rem] border-2 border-white bg-transparent text-white font-bold uppercase tracking-wider text-[11px] rounded-full hover:bg-white/10 active:scale-95 cursor-pointer transition-all duration-200 block mx-auto" 
              onClick={() => {
                setIsSignUpMode(false);
                setIsForgotPasswordMode(false);
                setUseDelay(true);
              }}
            >
              Sign in
            </button>
          </div>
          <AuthPanelArt variant="right" isSignUpMode={isSignUpMode} />
        </div>

      </div>
    </div>
  );
}
