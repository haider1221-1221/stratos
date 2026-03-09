import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import LanguageSelect from "./pages/LanguageSelect";
import LessonPath from "./pages/LessonPath";
import LessonPlayer from "./pages/LessonPlayer";
import Flashcards from "./pages/Flashcards";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import Friends from "./pages/Friends";

import "./App.css";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route - redirect to dashboard if logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running in Electron and listen for navigation events
    if (window.electron && typeof window.electron.onNavigate === 'function') {
      const cleanup = window.electron.onNavigate((path) => {
        console.log(`Navigating to ${path} from Electron Tray`);
        navigate(path);
      });
      return cleanup;
    }
  }, [navigate]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/languages" element={<ProtectedRoute><LanguageSelect /></ProtectedRoute>} />
      <Route path="/learn/:language" element={<ProtectedRoute><LessonPath /></ProtectedRoute>} />
      <Route path="/lesson/:language/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
      <Route path="/flashcards/:language" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '1rem',
              fontWeight: 600,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
