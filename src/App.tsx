import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import routes from "tempo-routes";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";

// Pages
import HomePage from "./pages/home";
import ReportWastePage from "./pages/report-waste";
import DashboardPage from "./pages/dashboard";
import LeaderboardPage from "./pages/leaderboard";
import ContactPage from "./pages/contact";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="smartwaste-theme">
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportWastePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
