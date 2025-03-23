import { Suspense, lazy, useEffect } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import routes from "tempo-routes";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./components/auth/auth-provider";
import { useAuth } from "./components/auth/auth-provider";

// Pages
import HomePage from "./pages/home";
import ReportWastePage from "./pages/report-waste";
import DashboardPage from "./pages/dashboard";
import LeaderboardPage from "./pages/leaderboard";
import ContactPage from "./pages/contact";
import LoginPage from "./pages/login";
import ProfilePage from "./pages/profile";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  // Log any auth errors to help with debugging
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "Auth state changed:",
        event,
        session ? "User session exists" : "No user session",
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="smartwaste-theme">
      <AuthProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          }
        >
          <>
            {/* Place Tempo routes before the main Routes */}
            {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route
                path="/auth/callback"
                element={
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    }
                  >
                    <LazyCallback />
                  </Suspense>
                }
              />

              {/* Protected routes */}
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportWastePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Lazy loaded callback component
const LazyCallback = lazy(() => import("./pages/auth/callback"));

export default App;
