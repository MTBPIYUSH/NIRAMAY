import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SubWorkerDashboard } from './components/SubWorkerDashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (user && profile) {
      setCurrentView('dashboard');
    } else if (user && !profile) {
      // User exists but no profile - might be pending verification
      setCurrentView('auth');
    } else if (!user && !loading) {
      // No user and not loading - redirect to auth for re-authentication
      setCurrentView('auth');
    }
  }, [user, profile, loading]);

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleAuthSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading Niramay...</div>
        </div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentView === 'dashboard' && profile) {
    switch (profile.role) {
      case 'citizen':
        return <CitizenDashboard user={profile} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={profile} onLogout={handleLogout} />;
      case 'subworker':
        return <SubWorkerDashboard user={profile} onLogout={handleLogout} />;
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}

export default App;