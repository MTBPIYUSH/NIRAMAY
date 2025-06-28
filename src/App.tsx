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
  const [appInitialized, setAppInitialized] = useState(false);

  // Handle view changes based on auth state
  useEffect(() => {
    // Wait for auth to initialize
    if (loading) return;

    console.log('🔄 App state update - User:', !!user, 'Profile:', !!profile, 'Role:', profile?.role);

    if (user && profile) {
      console.log('✅ User authenticated with profile, redirecting to dashboard');
      setCurrentView('dashboard');
    } else if (user && !profile) {
      console.log('⚠️ User authenticated but no profile found, staying on auth');
      setCurrentView('auth');
    } else {
      console.log('ℹ️ No authenticated user, showing landing page');
      setCurrentView('landing');
    }

    setAppInitialized(true);
  }, [user, profile, loading]);

  const handleGetStarted = () => {
    console.log('🚀 Get started clicked');
    setCurrentView('auth');
  };

  const handleAuthSuccess = () => {
    console.log('✅ Auth success callback');
    // Don't manually set view here - let useEffect handle it based on auth state
  };

  const handleLogout = async () => {
    console.log('👋 Logout initiated');
    try {
      await signOut();
      setCurrentView('landing');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Show loading screen while initializing
  if (!appInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="text-lg font-semibold text-gray-700 mb-2">Loading Niramay...</div>
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm text-gray-500 mt-4">
            {loading ? 'Checking authentication...' : 'Initializing app...'}
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate view
  if (currentView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentView === 'dashboard' && profile) {
    console.log('🎯 Rendering dashboard for role:', profile.role);
    
    switch (profile.role) {
      case 'citizen':
        return <CitizenDashboard user={profile} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={profile} onLogout={handleLogout} />;
      case 'subworker':
        return <SubWorkerDashboard user={profile} onLogout={handleLogout} />;
      default:
        console.error('❌ Unknown user role:', profile.role);
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  }

  // Fallback
  console.log('⚠️ Fallback to landing page');
  return <LandingPage onGetStarted={handleGetStarted} />;
}

export default App;