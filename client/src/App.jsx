import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./redux/user/userSlice.js";
import KumoriLandingPage from "./pages/landing/KumoriLandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";

export default function App() {
  const [page, setPage] = useState("landing");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Track cursor position for the premium cursor-glow backlight effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Listen to hash changes for simple hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#/login") {
        if (isAuthenticated) {
          window.location.hash = "#/dashboard";
        } else {
          setPage("login");
        }
      } else if (hash === "#/register") {
        if (isAuthenticated) {
          window.location.hash = "#/dashboard";
        } else {
          setPage("register");
        }
      } else if (hash === "#/dashboard") {
        if (!isAuthenticated) {
          window.location.hash = "#/login";
        } else {
          setPage("dashboard");
        }
      } else {
        setPage("landing");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // run on mount
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isAuthenticated]);

  // Auth state change auto-redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (isAuthenticated) {
      if (hash === "#/login" || hash === "#/register") {
        window.location.hash = "#/dashboard";
      }
    } else {
      if (hash === "#/dashboard") {
        window.location.hash = "#/login";
      }
    }
  }, [isAuthenticated]);

  const navigate = (newPage) => {
    if (newPage === "landing") {
      window.location.hash = "";
    } else {
      window.location.hash = `#/${newPage}`;
    }
  };

  return (
    <div className="relative min-h-screen text-[#2a2e33] font-sans antialiased overflow-x-hidden selection:bg-[#c62828]/10 selection:text-[#c62828]">
      {/* 1. Subtle repeating dot noise pattern layer */}
      <div className="noise-layer absolute inset-0 opacity-[0.4] pointer-events-none" />

      {/* 2. Cursor glow follow element */}
      <div
        className="cursor-glow hidden lg:block fixed"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          background:
            "radial-gradient(circle, rgba(198, 40, 40, 0.08) 0%, transparent 70%)",
          transition: "left 0.1s ease-out, top 0.1s ease-out",
        }}
      />

      {page === "landing" && <KumoriLandingPage onNavigate={navigate} />}
      {page === "login" && <LoginPage onNavigate={navigate} />}
      {page === "register" && <RegisterPage onNavigate={navigate} />}
      {page === "dashboard" && <DashboardPage />}
    </div>
  );
}
