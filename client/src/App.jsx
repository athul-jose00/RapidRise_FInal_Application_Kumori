import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { selectIsAuthenticated } from "./redux/user/userSlice.js";
import KumoriLandingPage from "./pages/landing/KumoriLandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import StorageOverviewPage from "./pages/dashboard/StorageOverviewPage.jsx";
import SharedFileView from "./pages/public/SharedFileView.jsx";

// Auth Guard: Only authenticated users can access the route
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Guest Guard: Authenticated users are redirected away from login/register to dashboard
function GuestRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// Wrapper to extract route params
function SharedFileViewWrapper() {
  const { token } = useParams();
  return <SharedFileView token={token} />;
}

function AppContent() {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    if (path === "landing") {
      navigate("/");
    } else {
      navigate(`/${path}`);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<KumoriLandingPage onNavigate={handleNavigate} />} />
      
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            <LoginPage onNavigate={handleNavigate} />
          </GuestRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <GuestRoute>
            <RegisterPage onNavigate={handleNavigate} />
          </GuestRoute>
        } 
      />

      <Route
        path="/dashboard/storage"
        element={
          <ProtectedRoute>
            <StorageOverviewPage />
          </ProtectedRoute>
        }
      />

      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/share/:token" 
        element={<SharedFileViewWrapper />} 
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track cursor position for the premium cursor-glow backlight effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <BrowserRouter>
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

        <AppContent />
      </div>
    </BrowserRouter>
  );
}
