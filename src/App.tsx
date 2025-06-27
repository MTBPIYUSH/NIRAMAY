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
    }
  }, [user, profile]);

  // Force show landing page after 2 seconds if still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing landing page');
        setCurrentView('landing');
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [loading]);

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

  // Show loading only for a brief moment
  if (loading && currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading Niramay...</div>
          <div className="text-sm text-gray-500 mt-2">Initializing platform...</div>
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
    // Create mock user data if profile is missing
    const mockProfile = profile || {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'citizen' as const,
      points: 1250,
      ward: 'Ward 12',
      city: 'Gurgaon'
    };

    switch (mockProfile.role) {
      case 'citizen':
        return <CitizenDashboard user={mockProfile} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={mockProfile} onLogout={handleLogout} />;
      case 'subworker':
        return <SubWorkerDashboard user={mockProfile} onLogout={handleLogout} />;
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}

export default App;